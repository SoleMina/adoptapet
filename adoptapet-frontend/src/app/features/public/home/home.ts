import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PetApi } from '@core/api/pet-api';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHeader } from '@shared/components/page-header/page-header';
import { PetCard } from '@shared/components/pet-card/pet-card';
import { PetCardSkeleton } from '@shared/components/pet-card-skeleton/pet-card-skeleton';

const FEATURED = 3;

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHeader,
    PetCard,
    PetCardSkeleton,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly petApi = inject(PetApi);

  protected readonly steps = [
    'Conoce una mascota',
    'Envía tu solicitud',
    'Espera la revisión',
    'Recíbela',
  ];
  protected readonly skeletons = Array.from({ length: FEATURED }, (_, i) => i);

  protected readonly pets = rxResource({
    stream: () => this.petApi.list({ status: 'AVAILABLE' }),
  });

  /** Healthy pets first: those are the ones that can be adopted right now. */
  protected readonly featured = computed(() =>
    [...(this.pets.value() ?? [])]
      .sort((a, b) => Number(b.healthStatus === 'HEALTHY') - Number(a.healthStatus === 'HEALTHY'))
      .slice(0, FEATURED),
  );

  protected readonly hasMore = computed(() => (this.pets.value()?.length ?? 0) > FEATURED);
}
