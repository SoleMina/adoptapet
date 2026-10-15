import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Lists while their data arrives: the paw spinner of the design and placeholder rows below. */
@Component({
  selector: 'app-loading-state',
  imports: [MatIconModule],
  template: `
    <div class="spinner-card" role="status">
      <span class="spinner" aria-hidden="true">
        <mat-icon>pets</mat-icon>
      </span>
      <p class="message">{{ message() }}</p>
    </div>
    <div class="rows" aria-hidden="true">
      @for (row of placeholders(); track row) {
        <div class="row">
          <span class="row__thumb"></span>
          <span class="row__lines">
            <span class="bar bar--title"></span>
            <span class="row__sub">
              <span class="bar bar--short"></span>
              <span class="bar bar--long"></span>
            </span>
          </span>
          <span class="row__pills">
            <span class="bar bar--pill"></span>
            <span class="bar bar--pill"></span>
          </span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--ap-space-4);
    }

    .spinner-card {
      display: grid;
      justify-items: center;
      gap: var(--ap-space-4);
      padding: var(--ap-space-8) var(--ap-space-4);
      border-radius: var(--ap-radius-xl);
      background-color: var(--ap-color-surface);
    }

    .spinner {
      position: relative;
      display: grid;
      place-items: center;
      width: 120px;
      height: 120px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 10px solid var(--ap-color-primary-soft);
      }

      &::after {
        border-color: var(--ap-color-primary) transparent transparent transparent;
        animation: spin 1s linear infinite;
      }

      .mat-icon {
        width: 48px;
        height: 48px;
        font-size: 48px;
        font-variation-settings: 'FILL' 1;
        color: var(--ap-color-primary);
      }
    }

    .message {
      font-size: var(--ap-font-size-lg);
      font-weight: 600;
      color: var(--ap-color-primary);
      text-align: center;
    }

    .rows {
      display: grid;
      gap: var(--ap-space-3);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--ap-space-5);
      padding: var(--ap-space-4);
      border-radius: var(--ap-radius-xl);
      background-color: var(--ap-color-surface);
      box-shadow: var(--ap-shadow-sm);
    }

    .row__thumb {
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      border-radius: var(--ap-radius-lg);
    }

    .row__lines {
      display: grid;
      flex: 1;
      gap: var(--ap-space-3);
      min-width: 0;
    }

    .row__sub {
      display: flex;
      gap: var(--ap-space-4);
    }

    .row__pills {
      display: none;
      gap: var(--ap-space-4);

      @media (min-width: 900px) {
        display: flex;
      }
    }

    .bar {
      display: block;
      height: 20px;
      border-radius: 999px;

      &--title {
        width: min(320px, 70%);
        height: 24px;
      }

      &--short {
        width: 25%;
      }

      &--long {
        width: 35%;
      }

      &--pill {
        width: 90px;
        height: 26px;
      }
    }

    .row__thumb,
    .bar {
      background:
        linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--ap-color-surface) 60%, transparent),
            transparent
          )
          0 0 / 200% 100% no-repeat,
        var(--ap-color-neutral-soft);
      animation: shimmer 1.4s ease-in-out infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes shimmer {
      from {
        background-position:
          150% 0,
          0 0;
      }
      to {
        background-position:
          -50% 0,
          0 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner::after,
      .row__thumb,
      .bar {
        animation: none;
      }
    }
  `,
})
export class LoadingState {
  readonly message = input('Estamos cargando la información.');
  readonly rows = input(4);

  protected readonly placeholders = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i),
  );
}
