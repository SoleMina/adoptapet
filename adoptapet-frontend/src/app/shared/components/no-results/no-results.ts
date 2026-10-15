import { Component, input } from '@angular/core';
import { StateView } from '../state-view/state-view';

/** A filtered list came back empty. Put the "Limpiar filtros" button inside. */
@Component({
  selector: 'app-no-results',
  imports: [StateView],
  template: ` <app-state-view art="search" [message]="message()"><ng-content /></app-state-view> `,
})
export class NoResults {
  readonly message = input('No encontramos resultados con estos filtros.');
}
