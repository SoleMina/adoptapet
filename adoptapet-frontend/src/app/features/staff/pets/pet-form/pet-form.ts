import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { PetApi } from '@core/api/pet-api';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { imageUrl } from '@core/http/api-url';
import { SPECIES_OPTIONS, healthStatusLabel, sterilizationLabel } from '@core/i18n/labels';
import { HealthStatus, PetRequest, PetResponse, Sex, SterilizationStatus } from '@core/models/pet';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { FieldError } from '@shared/components/field-error/field-error';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { valueOf } from '@shared/utils/resource';

/** Same rule as pet-service: JPG, PNG or WEBP, up to 5 MB. */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_MB = 5;

const HEALTH: HealthStatus[] = ['HEALTHY', 'IN_TREATMENT', 'NOT_FIT'];
const STERILIZATION: SterilizationStatus[] = ['STERILIZED', 'NOT_STERILIZED', 'UNKNOWN'];

/** Messages of the backend that mean "someone saved this pet after you opened it". */
const STALE_MESSAGES = [
  'The pet was modified by another user. Reload it and try again',
  'The record was modified by another user. Reload it and try again',
];

/**
 * Pet sheet for the staff. Without `id` it registers a pet (POST /pets); with `id` it edits it
 * (PUT /pets/{id}, with the version read, so two people cannot overwrite each other).
 */
@Component({
  selector: 'app-pet-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    FieldError,
    ErrorState,
  ],
  templateUrl: './pet-form.html',
  styleUrl: './pet-form.scss',
})
export class PetForm {
  private readonly petApi = inject(PetApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private readonly titles = inject(PageTitleStrategy);

  /** Route param :id; missing on /staff/pets/new. */
  readonly id = input<string>();

  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly heading = computed(() =>
    this.editing() ? 'Editar mascota' : 'Registrar mascota',
  );

  protected readonly pet = rxResource({
    params: () => (this.id() === undefined ? undefined : Number(this.id())),
    stream: ({ params: id }) => this.petApi.get(id),
  });
  private readonly loaded = computed(() => valueOf(this.pet));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    species: ['Perro', [Validators.required, Validators.maxLength(30)]],
    breed: ['', [Validators.required, Validators.maxLength(50)]],
    sex: ['FEMALE' as Sex, Validators.required],
    ageYears: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
    ageMonths: [0, [Validators.required, Validators.min(0), Validators.max(11)]],
    healthStatus: ['HEALTHY' as HealthStatus, Validators.required],
    sterilizationStatus: ['UNKNOWN' as SterilizationStatus, Validators.required],
    observations: ['', Validators.maxLength(500)],
  });
  protected readonly controls = this.form.controls;

  /** The pet may have a species that is not in the list (free text in the backend): keep it selectable. */
  protected readonly speciesOptions = computed(() => {
    const current = this.loaded()?.species;
    return current && !SPECIES_OPTIONS.includes(current)
      ? [current, ...SPECIES_OPTIONS]
      : SPECIES_OPTIONS;
  });

  /** "Sana / Sano", "Esterilizada / Esterilizado": the options follow the selected sex. */
  private readonly sex = toSignal(this.controls.sex.valueChanges, {
    initialValue: this.controls.sex.value,
  });
  protected readonly healthOptions = computed(() =>
    HEALTH.map((value) => ({ value, label: healthStatusLabel(value, this.sex()) })),
  );
  protected readonly sterilizationOptions = computed(() =>
    STERILIZATION.map((value) => ({ value, label: sterilizationLabel(value, this.sex()) })),
  );

  // ----- photo
  protected readonly image = signal<File | null>(null);
  protected readonly imageError = signal<string | null>(null);
  private readonly localPreview = signal<string | null>(null);
  /** The picked image, or the one the pet already has. */
  protected readonly preview = computed(
    () => this.localPreview() ?? imageUrl(this.loaded()?.imageUrl),
  );

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** true when the pet was changed by someone else and has to be reloaded. */
  protected readonly stale = signal(false);

  constructor() {
    effect(() => this.titles.setPageTitle(this.heading()));
    effect(() => {
      const pet = this.loaded();
      if (pet) {
        this.fill(pet);
      }
    });
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected onImagePicked(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      this.imageError.set(`La imagen supera los ${MAX_IMAGE_MB} MB`);
      return;
    }
    this.imageError.set(null);
    this.revokePreview();
    this.image.set(file);
    this.localPreview.set(URL.createObjectURL(file));
  }

  protected removeImage(): void {
    this.revokePreview();
    this.image.set(null);
    this.localPreview.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const pet = this.loaded();
    const request = this.toRequest(pet);
    const call = pet
      ? this.petApi.update(pet.id, request, this.image())
      : this.petApi.create(request, this.image());

    this.saving.set(true);
    this.error.set(null);
    call.subscribe({
      next: (saved) => {
        this.notify.success(
          pet ? `Guardamos los cambios de ${saved.name}` : `${saved.name} ya está en el catálogo`,
        );
        void this.router.navigateByUrl('/staff/pets');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError) {
          this.showServerError(error);
        }
      },
    });
  }

  /** Discards what was typed and loads the pet again (after a "modified by another user"). */
  protected reload(): void {
    this.stale.set(false);
    this.error.set(null);
    this.removeImage();
    this.pet.reload();
  }

  private showServerError(error: ApiError): void {
    if (STALE_MESSAGES.includes(error.detail)) {
      error.notified = true;
      this.stale.set(true);
      this.error.set(error.message);
      return;
    }
    if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
      error.notified = true;
      this.error.set(error.message);
    }
  }

  private fill(pet: PetResponse): void {
    this.form.reset({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      ageYears: pet.ageYears,
      ageMonths: pet.ageMonths,
      healthStatus: pet.healthStatus,
      sterilizationStatus: pet.sterilizationStatus,
      observations: pet.observations ?? '',
    });
  }

  private toRequest(pet: PetResponse | undefined): PetRequest {
    const value = this.form.getRawValue();
    return {
      ...value,
      name: value.name.trim(),
      breed: value.breed.trim(),
      observations: value.observations.trim() || undefined,
      version: pet?.version,
    };
  }

  private revokePreview(): void {
    const url = this.localPreview();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
