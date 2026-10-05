import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PetApi } from '@core/api/pet-api';
import { ApiError } from '@core/errors/api-error';
import {
  ADOPTION_STATUS_TONE,
  HEALTH_STATUS_TONE,
  adoptionStatusLabel,
  healthStatusLabel,
  speciesLabel,
} from '@core/i18n/labels';
import { AdoptionStatus, PetResponse } from '@core/models/pet';
import { Confirm } from '@core/ui/confirm';
import { Notify } from '@core/ui/notify';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { valueOf } from '@shared/utils/resource';
import { EMPTY, Observable, catchError, finalize, forkJoin, map, switchMap, tap } from 'rxjs';

const STATUS_OPTIONS: { value: AdoptionStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'RESERVED', label: 'Reservada' },
  { value: 'ADOPTED', label: 'Adoptada' },
  { value: 'INACTIVE', label: 'Inactiva' },
];

/** Staff: every pet of the shelter, with edit, deactivate and reactivate. */
@Component({
  selector: 'app-pet-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    PetPhoto,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './pet-list.html',
  styleUrl: './pet-list.scss',
})
export class PetList {
  private readonly petApi = inject(PetApi);
  private readonly confirm = inject(Confirm);
  private readonly notify = inject(Notify);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly status = signal<AdoptionStatus | ''>('');
  protected readonly species = signal('');
  /** Pet with an action in progress (its buttons are disabled). */
  protected readonly busyId = signal<number | null>(null);

  /** GET /pets leaves the inactive pets out, so they are asked for separately. */
  protected readonly pets = rxResource({
    stream: () =>
      forkJoin([this.petApi.list(), this.petApi.list({ status: 'INACTIVE' })]).pipe(
        // newest first, wherever they come from
        map(([active, inactive]) => [...active, ...inactive].sort((a, b) => b.id - a.id)),
      ),
  });

  protected readonly speciesOptions = computed(() => {
    const values = new Set((valueOf(this.pets) ?? []).map((pet) => pet.species));
    return [...values]
      .map((value) => ({ value, label: speciesLabel(value) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  protected readonly rows = computed(() =>
    (valueOf(this.pets) ?? [])
      .filter(
        (pet) =>
          (!this.status() || pet.adoptionStatus === this.status()) &&
          (!this.species() || pet.species === this.species()),
      )
      .map((pet) => ({
        pet,
        species: speciesLabel(pet.species),
        health: {
          text: healthStatusLabel(pet.healthStatus, pet.sex),
          tone: HEALTH_STATUS_TONE[pet.healthStatus],
        },
        status: {
          text: adoptionStatusLabel(pet.adoptionStatus, pet.sex),
          tone: ADOPTION_STATUS_TONE[pet.adoptionStatus],
        },
      })),
  );

  protected readonly hasFilters = computed(() => !!this.status() || !!this.species());

  protected onStatus(value: string): void {
    this.status.set(value as AdoptionStatus | '');
  }

  protected clearFilters(): void {
    this.status.set('');
    this.species.set('');
  }

  protected deactivate(pet: PetResponse): void {
    this.confirm
      .ask({
        title: `¿Desactivar a ${pet.name}?`,
        message: `${pet.name} dejará de aparecer en el catálogo. Su ficha se conserva y puedes reactivarla cuando quieras.`,
        confirmLabel: 'Desactivar',
        tone: 'danger',
      })
      .pipe(switchMap(() => this.run(pet, this.petApi.deactivate(pet.id, pet.version))))
      .subscribe((updated) => this.notify.success(`${updated.name} quedó inactiva en el catálogo`));
  }

  protected reactivate(pet: PetResponse): void {
    this.run(pet, this.petApi.activate(pet.id)).subscribe((updated) =>
      this.notify.success(`${updated.name} vuelve a estar disponible`),
    );
  }

  /** Runs an action on one pet and puts the result in the list. A conflict reloads the list. */
  private run(pet: PetResponse, action: Observable<PetResponse>): Observable<PetResponse> {
    this.busyId.set(pet.id);
    return action.pipe(
      tap((updated) =>
        this.pets.update((list) => list?.map((item) => (item.id === updated.id ? updated : item))),
      ),
      catchError((error: unknown) => {
        if (error instanceof ApiError && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
          // Someone else changed it: show the current data.
          this.pets.reload();
        }
        return EMPTY;
      }),
      finalize(() => this.busyId.set(null)),
    );
  }
}
