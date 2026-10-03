import { Component, computed, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { AuthStore } from '@core/auth/auth-store';
import { PetBadge, PetFact, petBadges, petFacts } from '@shared/utils/pet-info';
import { PetResponse } from '@core/models/pet';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';

/** What the adopt button does for the current visitor. */
interface AdoptAction {
  /** Hidden for staff. */
  visible: boolean;
  enabled: boolean;
  link: string[];
  queryParams?: Record<string, string>;
  /** Message under the card. */
  note: string;
  /** Link shown with the note (e.g. the existing application). */
  noteLink?: { label: string; path: string[] };
}

@Component({
  selector: 'app-pet-detail',
  imports: [MatButtonModule, MatIconModule, RouterLink, PageHero, PetPhoto, ErrorState],
  templateUrl: './pet-detail.html',
  styleUrl: './pet-detail.scss',
})
export class PetDetail {
  private readonly petApi = inject(PetApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly auth = inject(AuthStore);
  private readonly titles = inject(PageTitleStrategy);

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly pet = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.petApi.get(id),
  });

  /** Only adopters: to know if they already applied for this pet. */
  private readonly myApplications = rxResource({
    params: () => (this.auth.isAdopter() ? true : undefined),
    stream: () => this.applicationApi.mine(),
  });

  protected readonly heading = computed(() => {
    const pet = this.pet.value();
    return pet ? `Detalle de ${pet.name}` : 'Detalle de mascota';
  });

  protected readonly badges = computed<PetBadge[]>(() => {
    const pet = this.pet.value();
    return pet ? petBadges(pet) : [];
  });

  /** Two columns, as in the design: species/age/sterilization and sex/breed. */
  protected readonly facts = computed<PetFact[][]>(() => {
    const pet = this.pet.value();
    if (!pet) return [];
    const facts = petFacts(pet);
    return [facts.slice(0, 3), facts.slice(3)];
  });

  /** "Quiero adoptarla" / "Quiero adoptarlo". */
  protected readonly adoptLabel = computed(() =>
    this.pet.value()?.sex === 'MALE' ? 'Quiero adoptarlo' : 'Quiero adoptarla',
  );

  protected readonly action = computed<AdoptAction | null>(() => {
    const pet = this.pet.value();
    return pet ? this.actionFor(pet) : null;
  });

  constructor() {
    effect(() => this.titles.setPageTitle(this.pet.value()?.name ?? 'Detalle de mascota'));
  }

  private actionFor(pet: PetResponse): AdoptAction {
    const applyLink = ['/apply', String(pet.id)];
    const closed: Omit<AdoptAction, 'note'> = { visible: true, enabled: false, link: applyLink };

    if (this.auth.isStaff()) {
      return {
        ...closed,
        visible: false,
        note: 'Estás viendo el catálogo como personal del albergue.',
      };
    }
    if (pet.adoptionStatus !== 'AVAILABLE') {
      return { ...closed, note: `${pet.name} ya no está disponible para adopción.` };
    }
    if (pet.healthStatus !== 'HEALTHY') {
      return {
        ...closed,
        note: `${pet.name} está recibiendo cuidados y por ahora no puede ser ${pet.sex === 'MALE' ? 'adoptado' : 'adoptada'}. Vuelve a revisar pronto.`,
      };
    }
    if (!this.auth.isAuthenticated()) {
      return {
        visible: true,
        enabled: true,
        link: ['/login'],
        queryParams: { returnUrl: `/apply/${pet.id}` },
        note: 'Para enviar una solicitud, inicia sesión. El equipo revisará tu postulación.',
      };
    }
    const pending = this.myApplications
      .value()
      ?.find((application) => application.petId === pet.id && application.status === 'PENDING');
    if (pending) {
      return {
        ...closed,
        note: `Ya enviaste una solicitud para ${pet.name}. El equipo la está revisando.`,
        noteLink: { label: 'Ver mi solicitud', path: ['/my-applications', String(pending.id)] },
      };
    }
    return {
      visible: true,
      enabled: true,
      link: applyLink,
      note: 'El equipo revisará tu postulación y te avisará por notificaciones.',
    };
  }
}
