import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { PetApi } from '@core/api/pet-api';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetCard } from '@shared/components/pet-card/pet-card';
import { PetCardSkeleton } from '@shared/components/pet-card-skeleton/pet-card-skeleton';
import { valueOf } from '@shared/utils/resource';

const FEATURED = 3;

interface Step {
  icon: string;
  label: string;
}

@Component({
  selector: 'app-home',
  imports: [MatIconModule, PageHero, PetCard, PetCardSkeleton, EmptyState, ErrorState],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly petApi = inject(PetApi);

  protected readonly steps: Step[] = [
    { icon: 'pets', label: 'Conoce una mascota' },
    { icon: 'edit_document', label: 'Envía tu solicitud' },
    { icon: 'search', label: 'Espera la revisión' },
    { icon: 'home', label: 'Recíbela' },
  ];
  protected readonly skeletons = Array.from({ length: FEATURED }, (_, i) => i);

  protected readonly pets = rxResource({
    stream: () => this.petApi.list({ status: 'AVAILABLE' }),
  });

  /** Healthy pets first: those are the ones that can be adopted right now. */
  protected readonly featured = computed(() =>
    [...(valueOf(this.pets) ?? [])]
      .sort((a, b) => Number(b.healthStatus === 'HEALTHY') - Number(a.healthStatus === 'HEALTHY'))
      .slice(0, FEATURED),
  );
}
