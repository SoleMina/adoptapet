import { Component, ElementRef, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { HOUSING_TYPES } from '@core/i18n/labels';
import { ApplicationRequest, ApplicationResponse } from '@core/models/application';
import { PetResponse } from '@core/models/pet';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { ErrorState } from '@shared/components/error-state/error-state';
import { FieldError } from '@shared/components/field-error/field-error';
import { FileDrop } from '@shared/components/file-drop/file-drop';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { petBadges, petFacts } from '@shared/utils/pet-info';
import { ApplicationSent } from './application-sent/application-sent';

type Step = 1 | 2 | 3 | 4;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Mascota' },
  { step: 2, label: 'Tu hogar' },
  { step: 3, label: 'Documentos' },
  { step: 4, label: 'Revisar' },
];

/**
 * Adoption application in 4 steps (pet → home → documents → review), then the "sent" screen.
 * Route: /apply/:petId (adopters only).
 */
@Component({
  selector: 'app-apply',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHero,
    PetPhoto,
    FieldError,
    FileDrop,
    ApplicationSent,
    ErrorState,
  ],
  templateUrl: './apply.html',
  styleUrl: './apply.scss',
})
export class Apply {
  private readonly petApi = inject(PetApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly router = inject(Router);
  private readonly titles = inject(PageTitleStrategy);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Route param :petId (component input binding). */
  readonly petId = input.required<string>();

  protected readonly steps = STEPS;
  protected readonly housingTypes = HOUSING_TYPES;

  protected readonly pet = rxResource({
    params: () => Number(this.petId()),
    stream: ({ params: id }) => this.petApi.get(id),
  });

  /** To stop a second application for the same pet before the user fills everything in. */
  private readonly mine = rxResource({ stream: () => this.applicationApi.mine() });

  protected readonly step = signal<Step>(1);
  protected readonly sent = signal<ApplicationResponse | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly dniFile = signal<File | null>(null);
  protected readonly addressProofFile = signal<File | null>(null);
  protected readonly documentsTouched = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    adoptionReason: ['', [Validators.required, Validators.maxLength(1000)]],
    housingType: ['', [Validators.required, Validators.maxLength(100)]],
    petExperience: ['', [Validators.required, Validators.maxLength(1000)]],
    otherPets: ['', Validators.maxLength(500)],
    householdSize: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
    comments: ['', Validators.maxLength(1000)],
  });
  protected readonly controls = this.form.controls;
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly loading = computed(() => this.pet.isLoading() || this.mine.isLoading());

  protected readonly pendingApplication = computed(() => {
    const pet = this.pet.value();
    return this.mine
      .value()
      ?.find((application) => application.petId === pet?.id && application.status === 'PENDING');
  });

  /** Why this pet cannot receive an application right now (null = it can). */
  protected readonly blockedReason = computed(() => {
    const pet = this.pet.value();
    if (!pet) return null;
    if (pet.adoptionStatus !== 'AVAILABLE')
      return `${pet.name} ya no está disponible para adopción.`;
    if (pet.healthStatus !== 'HEALTHY') {
      return `${pet.name} está recibiendo cuidados y por ahora no puede ser adoptad${pet.sex === 'MALE' ? 'o' : 'a'}.`;
    }
    return null;
  });

  protected readonly heading = computed(() => {
    if (this.sent()) return 'Solicitud enviada';
    if (this.pendingApplication() || this.blockedReason()) return 'Solicitud de adopción';
    return `Solicitud · Paso ${this.step()}`;
  });

  protected readonly subtitle = computed(() => {
    const name = this.pet.value()?.name ?? 'tu mascota';
    return this.sent()
      ? `Recibimos tu solicitud para ${name}.`
      : `Tu solicitud para adoptar a ${name}`;
  });

  protected readonly badges = computed(() => {
    const pet = this.pet.value();
    return pet ? petBadges(pet) : [];
  });

  protected readonly facts = computed(() => {
    const pet = this.pet.value();
    return pet ? petFacts(pet) : [];
  });

  /** "Departamento · 3 personas" */
  protected readonly homeSummary = computed(() => {
    const { housingType, householdSize } = this.formValue();
    const people = householdSize === 1 ? '1 persona' : `${householdSize} personas`;
    return `${housingType} · ${people}`;
  });

  protected readonly reviewDocuments = computed(() => [
    { label: 'DNI', fileName: this.dniFile()?.name ?? '' },
    { label: 'Domicilio', fileName: this.addressProofFile()?.name ?? '' },
  ]);

  constructor() {
    effect(() => this.titles.setPageTitle(this.heading()));
  }

  protected next(): void {
    if (this.step() === 2 && this.form.invalid) {
      this.form.markAllAsTouched();
      this.focus('[aria-invalid="true"]');
      return;
    }
    if (this.step() === 3 && !(this.dniFile() && this.addressProofFile())) {
      this.documentsTouched.set(true);
      return;
    }
    this.goTo((this.step() + 1) as Step);
  }

  protected back(pet: PetResponse): void {
    if (this.step() === 1) {
      void this.router.navigate(['/pets', pet.id]);
      return;
    }
    this.goTo((this.step() - 1) as Step);
  }

  protected submit(pet: PetResponse): void {
    const dniFile = this.dniFile();
    const addressProofFile = this.addressProofFile();
    if (!dniFile || !addressProofFile) {
      this.goTo(3);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.applicationApi.create(this.toRequest(pet), dniFile, addressProofFile).subscribe({
      next: (application) => {
        this.submitting.set(false);
        this.sent.set(application);
        window.scrollTo({ top: 0 });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        if (!(error instanceof ApiError)) return;
        if (applyServerErrors(this.form, error).length) {
          this.goTo(2);
        } else if (!error.notified) {
          error.notified = true;
          this.error.set(error.message);
        }
      },
    });
  }

  private toRequest(pet: PetResponse): ApplicationRequest {
    const value = this.form.getRawValue();
    return {
      petId: pet.id,
      adoptionReason: value.adoptionReason.trim(),
      housingType: value.housingType,
      petExperience: value.petExperience.trim(),
      otherPets: value.otherPets.trim() || undefined,
      householdSize: value.householdSize,
      comments: value.comments.trim() || undefined,
    };
  }

  private goTo(step: Step): void {
    this.error.set(null);
    this.step.set(step);
    // Keyboard and screen reader users land on the title of the new step.
    this.focus('.step-title');
  }

  private focus(selector: string): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus());
  }
}
