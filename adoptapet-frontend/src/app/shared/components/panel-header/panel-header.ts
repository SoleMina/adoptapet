import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Title block of the staff pages: big heading, subtitle and the paws of the design on the right.
 * Page actions (e.g. "Nueva mascota") are projected next to the title.
 */
@Component({
  selector: 'app-panel-header',
  imports: [MatIconModule],
  template: `
    <div class="text">
      <h1 class="heading">{{ heading() }}</h1>
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
    </div>
    <div class="actions"><ng-content /></div>
    <div class="paws" aria-hidden="true">
      <mat-icon>pets</mat-icon>
      <mat-icon>pets</mat-icon>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--ap-space-4);
      margin-bottom: var(--ap-space-6);
    }

    .text {
      flex: 1;
      min-width: min(100%, 280px);
    }

    .heading {
      font-size: var(--ap-font-size-4xl);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin-top: var(--ap-space-3);
      font-size: var(--ap-font-size-lg);
      color: var(--ap-color-text-muted);
    }

    .actions:empty {
      display: none;
    }

    /* A page with an action ("Registrar mascota") shows it instead of the paws. */
    .actions:not(:empty) + .paws {
      display: none;
    }

    .paws {
      display: none;
      gap: var(--ap-space-5);
      padding-right: var(--ap-space-4);
      color: var(--ap-color-primary);
      opacity: 0.2;

      .mat-icon {
        width: 64px;
        height: 64px;
        font-size: 64px;
        font-variation-settings: 'FILL' 1;
        transform: rotate(-14deg);

        &:last-child {
          transform: translateY(-14px) rotate(16deg);
        }
      }

      @media (min-width: 900px) {
        display: flex;
      }
    }
  `,
})
export class PanelHeader {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
}
