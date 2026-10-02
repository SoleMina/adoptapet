import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/empty-state/empty-state';

/** 404 and 403. The texts come from the route `data`. */
@Component({
  selector: 'app-error-page',
  imports: [MatButtonModule, RouterLink, EmptyState],
  template: `
    <div class="ap-container page">
      <section class="ap-card">
        <app-empty-state [icon]="icon()" [heading]="heading()" [message]="message()">
          <a matButton="filled" routerLink="/inicio">Ir al inicio</a>
        </app-empty-state>
      </section>
    </div>
  `,
  styles: `
    .page {
      padding-block: var(--ap-space-12);
    }
  `,
})
export class ErrorPage {
  readonly icon = input('search_off');
  readonly heading = input('Página no encontrada');
  readonly message = input('La dirección que buscas no existe o fue movida.');
}
