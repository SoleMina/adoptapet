import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiError } from '@core/errors/api-error';

/** A request failed: explain it and offer to try again. */
@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <mat-icon class="icon" aria-hidden="true">{{
      notFound() ? 'search_off' : 'cloud_off'
    }}</mat-icon>
    <h2 class="title">{{ heading() }}</h2>
    <p class="message">{{ message() }}</p>
    <div class="actions">
      @if (!notFound()) {
        <button matButton="tonal" type="button" (click)="retry.emit()">
          <mat-icon aria-hidden="true">refresh</mat-icon>
          Reintentar
        </button>
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ap-space-2);
      padding: var(--ap-space-8) var(--ap-space-4);
      text-align: center;
    }

    .icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: var(--ap-color-text-muted);
    }

    .title {
      font-size: var(--ap-font-size-lg);
      font-weight: 700;
    }

    .message {
      max-width: 440px;
      color: var(--ap-color-text-muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ap-space-3);
      margin-top: var(--ap-space-3);
    }
  `,
})
export class ErrorState {
  readonly error = input<unknown>();
  readonly heading = input('No pudimos cargar la información');
  readonly retry = output();

  protected readonly notFound = computed(() => this.apiError()?.status === 404);
  protected readonly message = computed(
    () => this.apiError()?.message ?? 'Inténtalo de nuevo en unos segundos.',
  );

  private readonly apiError = computed(() => {
    const error = this.error();
    return error instanceof ApiError ? error : null;
  });
}
