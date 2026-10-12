import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { ApplicationApi } from '@core/api/application-api';
import { DeliverySlotApi } from '@core/api/delivery-slot-api';
import { PetApi } from '@core/api/pet-api';
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, Tone } from '@core/i18n/labels';
import { ApplicationStatus } from '@core/models/application';
import { SlotAvailabilityResponse } from '@core/models/delivery-slot';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';
import { limaToday } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { catchError, forkJoin, map, of } from 'rxjs';

/** Applications that have (or had) a delivery on a day. */
const WITH_DELIVERY: ApplicationStatus[] = ['APPROVED', 'NO_SHOW', 'COMPLETED'];

interface SlotRow {
  slot: SlotAvailabilityResponse;
  /** 0–100, how full the window is. */
  usage: number;
  state: { text: string; tone: Tone };
}

/** Staff: capacity of each delivery window on a day, and the deliveries booked for it. */
@Component({
  selector: 'app-delivery-calendar',
  imports: [MatIconModule, RouterLink, PanelHeader, PetPhoto, EmptyState, ErrorState, LimaDatePipe],
  templateUrl: './delivery-calendar.html',
  styleUrl: './delivery-calendar.scss',
})
export class DeliveryCalendar {
  private readonly slotApi = inject(DeliverySlotApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly adopterApi = inject(AdopterApi);
  private readonly petApi = inject(PetApi);
  private readonly router = inject(Router);

  /** Query param ?date=yyyy-MM-dd (component input binding); today in Peru by default. */
  readonly date = input<string>();

  protected readonly today = limaToday();
  protected readonly selected = linkedSignal(() =>
    /^\d{4}-\d{2}-\d{2}$/.test(this.date() ?? '') ? (this.date() as string) : this.today,
  );

  protected readonly slots = rxResource({
    params: () => this.selected(),
    stream: ({ params: date }) => this.slotApi.availability(date),
  });

  protected readonly applications = rxResource({ stream: () => this.applicationApi.list() });

  /** Names and photos. Optional: without them the rows show the ids and the placeholder. */
  private readonly lookups = rxResource({
    stream: () =>
      forkJoin({
        pets: forkJoin([this.petApi.list(), this.petApi.list({ status: 'INACTIVE' })]).pipe(
          map(([active, inactive]) => [...active, ...inactive]),
          catchError(() => of([])),
        ),
        adopters: this.adopterApi.list().pipe(catchError(() => of([]))),
      }),
    defaultValue: { pets: [], adopters: [] },
  });

  protected readonly slotRows = computed<SlotRow[]>(() =>
    (valueOf(this.slots) ?? []).map((slot) => ({
      slot,
      usage: slot.capacity ? Math.round((slot.reserved / slot.capacity) * 100) : 0,
      state: slotState(slot),
    })),
  );

  protected readonly deliveries = computed(() => {
    const { pets, adopters } = this.lookups.value();
    const images = new Map(pets.map((pet) => [pet.id, pet.imageUrl]));
    const names = new Map(adopters.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
    const date = this.selected();
    return (valueOf(this.applications) ?? [])
      .filter(
        (application) =>
          WITH_DELIVERY.includes(application.status) &&
          application.appointment?.deliveryDate === date,
      )
      .sort((a, b) =>
        (a.appointment?.startTime ?? '').localeCompare(b.appointment?.startTime ?? ''),
      )
      .map((application) => ({
        application,
        appointment: application.appointment!,
        imageUrl: images.get(application.petId) ?? null,
        adopter: names.get(application.adopterId) ?? `Adoptante #${application.adopterId}`,
        status: {
          text: APPLICATION_STATUS_LABEL[application.status],
          tone: APPLICATION_STATUS_TONE[application.status],
        },
      }));
  });

  protected onDate(value: string): void {
    if (!value) return;
    this.selected.set(value);
    // Keeps the day in the URL so it can be shared and survives "back".
    void this.router.navigate([], { queryParams: { date: value }, replaceUrl: true });
  }
}

function slotState(slot: SlotAvailabilityResponse): { text: string; tone: Tone } {
  if (slot.free <= 0) return { text: 'Completa', tone: 'warning' };
  if (slot.expired) return { text: 'Finalizada', tone: 'neutral' };
  return { text: 'Disponible', tone: 'success' };
}
