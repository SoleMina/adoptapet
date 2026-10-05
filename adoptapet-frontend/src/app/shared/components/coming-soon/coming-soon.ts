import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { EmptyState } from '../empty-state/empty-state';
import { PageHeader } from '../page-header/page-header';
import { PanelHeader } from '../panel-header/panel-header';

/**
 * Temporary page for the routes whose screen is not built yet.
 * `heading` and `description` come from the route `data` (component input binding).
 */
@Component({
  selector: 'app-coming-soon',
  imports: [MatButtonModule, RouterLink, EmptyState, PageHeader, PanelHeader],
  template: `
    @if (inPanel) {
      <app-panel-header [heading]="heading()" [subtitle]="description()" />
      <section class="ap-card">
        <app-empty-state
          icon="construction"
          heading="Pantalla en construcción"
          message="La navegación y los permisos ya funcionan; esta vista llega en la siguiente fase."
        >
          <a matButton="tonal" routerLink="/staff/dashboard">Volver al panel</a>
        </app-empty-state>
      </section>
    } @else {
      <div class="ap-container page">
        <app-page-header [heading]="heading()" [subtitle]="description()" />
        <section class="ap-card">
          <app-empty-state
            icon="construction"
            heading="Pantalla en construcción"
            message="La navegación y los permisos ya funcionan; esta vista llega en la siguiente fase."
          >
            <a matButton="tonal" routerLink="/pets">Ver mascotas</a>
          </app-empty-state>
        </section>
      </div>
    }
  `,
  styles: `
    .page {
      padding-block: var(--ap-space-8);
    }
  `,
})
export class ComingSoon {
  readonly heading = input('Próximamente');
  readonly description = input<string>();

  /** Inside the staff panel the layout already gives the breadcrumb and the page padding. */
  protected readonly inPanel = inject(Router).url.startsWith('/staff');
}
