import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PetApi } from '@core/api/pet-api';
import { speciesLabel } from '@core/i18n/labels';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetCard } from '@shared/components/pet-card/pet-card';
import { PetCardSkeleton } from '@shared/components/pet-card-skeleton/pet-card-skeleton';
import { valueOf } from '@shared/utils/resource';

/**
 * Available pets. The list is loaded once and filtered in the browser (instant feedback);
 * the filters live in the URL (?q=&species=) so a filtered catalog can be shared or bookmarked.
 */
@Component({
  selector: 'app-pet-catalog',
  imports: [
    MatButtonModule,
    MatIconModule,
    PageHero,
    PetCard,
    PetCardSkeleton,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './pet-catalog.html',
  styleUrl: './pet-catalog.scss',
})
export class PetCatalog {
  private readonly petApi = inject(PetApi);
  private readonly router = inject(Router);

  /** Query params (component input binding). */
  readonly q = input<string>();
  readonly species = input<string>();

  protected readonly search = linkedSignal(() => this.q() ?? '');
  protected readonly selectedSpecies = linkedSignal(() => this.species() ?? '');
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  protected readonly pets = rxResource({
    stream: () => this.petApi.list({ status: 'AVAILABLE' }),
  });

  protected readonly speciesOptions = computed(() => {
    const values = new Set((valueOf(this.pets) ?? []).map((pet) => pet.species));
    return [...values]
      .map((value) => ({ value, label: speciesLabel(value) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  protected readonly filtered = computed(() => {
    const term = normalize(this.search());
    const species = this.selectedSpecies();
    return (valueOf(this.pets) ?? []).filter(
      (pet) =>
        (!species || pet.species === species) &&
        (!term || normalize(`${pet.name} ${pet.breed}`).includes(term)),
    );
  });

  protected readonly hasFilters = computed(() => !!this.search() || !!this.selectedSpecies());

  /** "3 mascotas disponibles", "1 mascota encontrada"... */
  protected readonly countText = computed(() => {
    const count = this.filtered().length;
    const noun = count === 1 ? 'mascota' : 'mascotas';
    if (this.hasFilters()) {
      return `${count} ${noun} ${count === 1 ? 'encontrada' : 'encontradas'}`;
    }
    return `${count} ${noun} ${count === 1 ? 'disponible' : 'disponibles'}`;
  });

  protected onSearch(value: string): void {
    this.search.set(value);
    this.syncUrl();
  }

  protected onSpecies(value: string): void {
    this.selectedSpecies.set(value);
    this.syncUrl();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.selectedSpecies.set('');
    this.syncUrl();
  }

  private syncUrl(): void {
    void this.router.navigate([], {
      queryParams: { q: this.search() || null, species: this.selectedSpecies() || null },
      replaceUrl: true,
    });
  }
}

/** Case and accent insensitive search: "pequines" finds "Pequinés". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
