import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { ApiError } from '@core/errors/api-error';
import { ApplicationResponse } from '@core/models/application';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { limaNow } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';

/** Same rule as the backend: PDF, JPG or PNG up to 5 MB. */
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_MB = 5;

/** Staff: uploads (or replaces) the act signed by the adopter, once the delivery window started. */
@Component({
  selector: 'app-signed-act-upload',
  imports: [MatButtonModule, MatIconModule, RouterLink, PanelHeader, ErrorState],
  templateUrl: './signed-act-upload.html',
  styleUrl: './signed-act-upload.scss',
})
export class SignedActUpload {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly backPath = computed(() => `/staff/applications/${this.id()}`);
  protected readonly accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
  protected readonly maxMb = MAX_FILE_MB;

  protected readonly application = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.applicationApi.get(id),
  });
  protected readonly current = computed(() => valueOf(this.application));

  protected readonly blocked = computed(() => {
    const application = this.current();
    if (!application) return null;
    if (application.status !== 'APPROVED') return 'Esta solicitud ya no está aprobada.';
    if (!application.hasAct) return 'Primero genera el acta de adopción desde la solicitud.';
    const appointment = application.appointment;
    if (!appointment || limaNow() < `${appointment.deliveryDate}T${appointment.startTime}`) {
      return 'El acta firmada se puede subir cuando empieza la franja de entrega.';
    }
    return null;
  });

  protected readonly file = signal<File | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly saving = signal(false);

  protected readonly size = computed(() => {
    const bytes = this.file()?.size ?? 0;
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  });

  protected onPicked(picker: HTMLInputElement): void {
    this.take(picker.files?.[0]);
    picker.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.take(event.dataTransfer?.files[0]);
  }

  protected upload(application: ApplicationResponse): void {
    const file = this.file();
    if (!file) return;
    this.saving.set(true);
    this.applicationApi.uploadSignedAct(application.id, file).subscribe({
      next: () => {
        this.notify.success('Acta firmada guardada');
        void this.router.navigateByUrl(this.backPath());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
          if (error.isConflict) this.application.reload();
        }
      },
    });
  }

  private take(file: File | undefined): void {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.error.set('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      this.error.set(`El archivo supera los ${MAX_FILE_MB} MB`);
      return;
    }
    this.error.set(null);
    this.file.set(file);
  }
}
