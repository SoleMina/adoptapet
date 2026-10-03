import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  APPLICATION_STATUS_ICON,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from '@core/i18n/labels';
import { ApplicationStatus } from '@core/models/application';

/** Application status chip: "🕒 Pendiente", "✓ Aprobada"... */
@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  template: `
    <span class="ap-badge" [attr.data-tone]="tone()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      {{ text() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<ApplicationStatus>();
  /** Overrides the default label (e.g. "Pendiente de revisión"). */
  readonly label = input<string>();

  protected readonly icon = computed(() => APPLICATION_STATUS_ICON[this.status()]);
  protected readonly tone = computed(() => APPLICATION_STATUS_TONE[this.status()]);
  protected readonly text = computed(() => this.label() ?? APPLICATION_STATUS_LABEL[this.status()]);
}
