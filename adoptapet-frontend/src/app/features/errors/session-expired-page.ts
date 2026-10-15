import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { StateView } from '@shared/components/state-view/state-view';

/** Where `Auth.expire()` lands: the JWT expired or was rejected. ?returnUrl= is kept for the login. */
@Component({
  selector: 'app-session-expired-page',
  imports: [MatButtonModule, RouterLink, StateView],
  template: `
    <div class="ap-container page page--centered">
      <section class="ap-card card">
        <app-state-view
          art="expired"
          heading="Sesión expirada"
          message="Inicia sesión para continuar. Conservaremos la ruta que estabas visitando."
        >
          <a matButton="filled" routerLink="/login" [queryParams]="loginParams()">Iniciar sesión</a>
        </app-state-view>
      </section>
    </div>
  `,
  styleUrl: './error-pages.scss',
})
export class SessionExpiredPage {
  /** Query param (component input binding). */
  readonly returnUrl = input<string>();

  protected readonly loginParams = computed(() => {
    const url = this.returnUrl();
    return url?.startsWith('/') ? { returnUrl: url } : {};
  });
}
