import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Nothing to show yet. Put the call to action inside: `<app-empty-state ...><a matButton>...</a></app-empty-state>`. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <mat-icon class="icon" aria-hidden="true">{{ icon() }}</mat-icon>
    <h2 class="title">{{ heading() }}</h2>
    @if (message()) {
      <p class="message">{{ message() }}</p>
    }
    <div class="actions"><ng-content /></div>
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
      color: var(--ap-color-primary);
    }

    .title {
      font-size: var(--ap-font-size-lg);
      font-weight: 700;
    }

    .message {
      max-width: 420px;
      color: var(--ap-color-text-muted);
    }

    .actions:not(:empty) {
      margin-top: var(--ap-space-3);
    }
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly message = input<string>();
  /** Material Symbols name. */
  readonly icon = input('pets');
}
