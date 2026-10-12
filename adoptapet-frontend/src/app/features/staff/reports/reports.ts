import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PetApi } from '@core/api/pet-api';
import { ReportApi } from '@core/api/report-api';
import { ApiError } from '@core/errors/api-error';
import { APPLICATION_STATUS_LABEL, adoptionStatusLabel, speciesLabel } from '@core/i18n/labels';
import { ApplicationStatus } from '@core/models/application';
import { AdoptionStatus } from '@core/models/pet';
import { Notify } from '@core/ui/notify';
import { saveBlob } from '@core/utils/file-download';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { limaToday } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { catchError, forkJoin, of } from 'rxjs';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NO_SHOW',
  'COMPLETED',
  'CANCELLED',
];
const PET_STATUSES: AdoptionStatus[] = ['AVAILABLE', 'RESERVED', 'ADOPTED', 'INACTIVE'];

/** ADMIN: general report in PDF (GET /reports/general), optionally filtered. */
@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, PanelHeader],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  private readonly reportApi = inject(ReportApi);
  private readonly petApi = inject(PetApi);
  private readonly notify = inject(Notify);

  protected readonly applicationStatuses = APPLICATION_STATUSES.map((value) => ({
    value,
    label: APPLICATION_STATUS_LABEL[value],
  }));
  protected readonly petStatuses = PET_STATUSES.map((value) => ({
    value,
    label: adoptionStatusLabel(value),
  }));

  /** Species is free text: the options are the ones the registered pets have. */
  private readonly pets = rxResource({
    stream: () =>
      forkJoin([this.petApi.list(), this.petApi.list({ status: 'INACTIVE' })]).pipe(
        catchError(() => of([[], []])),
      ),
  });
  protected readonly speciesOptions = computed(() => {
    // one option per label: "dog" and "Perro" are the same choice for the reader
    const byLabel = new Map<string, string>();
    for (const pet of (valueOf(this.pets) ?? []).flat()) {
      const label = speciesLabel(pet.species);
      if (!byLabel.has(label)) byLabel.set(label, pet.species);
    }
    return [...byLabel]
      .map(([label, value]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    applicationStatus: '' as ApplicationStatus | '',
    petStatus: '' as AdoptionStatus | '',
    species: '',
  });

  protected readonly downloading = signal(false);

  protected download(): void {
    const { applicationStatus, petStatus, species } = this.form.getRawValue();
    this.downloading.set(true);
    this.reportApi
      .general({
        applicationStatus: applicationStatus || undefined,
        petStatus: petStatus || undefined,
        species: species || undefined,
      })
      .subscribe({
        next: (response) => {
          this.downloading.set(false);
          saveBlob(response, `reporte-general-${limaToday()}.pdf`);
          this.notify.success('Descargamos el reporte en PDF');
        },
        error: (error: unknown) => {
          this.downloading.set(false);
          if (error instanceof ApiError && !error.notified) {
            error.notified = true;
            this.notify.error('No pudimos generar el reporte. Inténtalo de nuevo.');
          }
        },
      });
  }

  protected clear(): void {
    this.form.reset();
  }
}
