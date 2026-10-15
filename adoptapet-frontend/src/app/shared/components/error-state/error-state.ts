import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiError } from '@core/errors/api-error';
import { StateView } from '../state-view/state-view';

const CONNECTION_MESSAGE = 'No pudimos cargar la información. Inténtalo de nuevo.';

/**
 * A request failed: the "Error de conexión" illustration and a retry button. A 404 shows `heading`
 * (e.g. "No encontramos esta mascota") without retry; put the way out inside.
 */
@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule, MatIconModule, StateView],
  template: `
    <app-state-view
      [art]="notFound() ? 'unavailable' : 'offline'"
      [heading]="notFound() ? heading() : undefined"
      [message]="message()"
    >
      @if (!notFound()) {
        <button matButton="filled" type="button" (click)="retry.emit()">
          <mat-icon aria-hidden="true">refresh</mat-icon>
          Reintentar
        </button>
      }
      <ng-content />
    </app-state-view>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ErrorState {
  readonly error = input<unknown>();
  /** Shown for a 404. */
  readonly heading = input('No encontramos lo que buscas');
  readonly retry = output();

  protected readonly notFound = computed(() => this.apiError()?.status === 404);

  /** Connection and server errors get the text of the design; the rest keep their own message. */
  protected readonly message = computed(() => {
    const error = this.apiError();
    if (!error || error.status === 0 || error.status >= 500) return CONNECTION_MESSAGE;
    return error.status === 404
      ? 'Puede que se haya eliminado o que el enlace no sea correcto.'
      : error.message;
  });

  private readonly apiError = computed(() => {
    const error = this.error();
    return error instanceof ApiError ? error : null;
  });
}
