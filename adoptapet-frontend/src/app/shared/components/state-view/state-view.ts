import { Component, input } from '@angular/core';

/** Illustrations of the design for empty, error and blocked states. */
export type StateArt =
  'search' | 'empty' | 'pending' | 'offline' | 'unavailable' | 'conflict' | 'expired' | 'forbidden';

/**
 * Centered illustration + optional heading + message, with the call to action projected inside:
 * `<app-state-view art="empty" message="..."><a matButton="filled">...</a></app-state-view>`.
 * Colors come from the theme tokens, so the drawings follow the dark theme too.
 */
@Component({
  selector: 'app-state-view',
  templateUrl: './state-view.html',
  styleUrl: './state-view.scss',
})
export class StateView {
  readonly art = input.required<StateArt>();
  readonly heading = input<string>();
  readonly message = input.required<string>();
}
