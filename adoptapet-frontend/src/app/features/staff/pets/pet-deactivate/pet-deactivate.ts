import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { PetApi } from '@core/api/pet-api';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { PetResponse } from '@core/models/pet';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { REASON_MAX_LENGTH, ReasonField } from '@shared/components/reason-field/reason-field';
import { valueOf } from '@shared/utils/resource';

/** Staff: takes an available pet out of the catalog (logical delete; it can be reactivated). */
@Component({
  selector: 'app-pet-deactivate',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    PetPhoto,
    ErrorState,
    ReasonField,
  ],
  templateUrl: './pet-deactivate.html',
  styleUrl: './deactivate-page.scss',
})
export class PetDeactivate {
  private readonly petApi = inject(PetApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly backPath = '/staff/pets';

  protected readonly pet = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.petApi.get(id),
  });
  protected readonly current = computed(() => valueOf(this.pet));

  protected readonly subtitle = computed(() => {
    const name = this.current()?.name;
    return name
      ? `${name} dejará de mostrarse en el catálogo. El registro se conserva.`
      : 'Dejará de mostrarse en el catálogo. El registro se conserva.';
  });

  /** Same rule as the backend: only an available pet can be deactivated. */
  protected readonly blocked = computed(() => {
    const pet = this.current();
    if (!pet || pet.adoptionStatus === 'AVAILABLE') return null;
    return pet.adoptionStatus === 'INACTIVE'
      ? `${pet.name} ya está inactiva.`
      : `${pet.name} tiene una adopción en curso o finalizada: solo se desactivan mascotas disponibles.`;
  });

  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: Validators.maxLength(REASON_MAX_LENGTH),
  });
  protected readonly form = new FormGroup({ reason: this.reason });
  protected readonly saving = signal(false);

  protected save(pet: PetResponse): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.petApi.deactivate(pet.id, pet.version, this.reason.value.trim() || undefined).subscribe({
      next: () => {
        this.notify.success(`${pet.name} quedó inactiva en el catálogo`);
        void this.router.navigateByUrl(this.backPath);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (!(error instanceof ApiError)) return;
        if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
        // someone else changed the pet: show the current one
        if (error.isConflict) this.pet.reload();
      },
    });
  }
}
