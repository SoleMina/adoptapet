import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { StateView } from '@shared/components/state-view/state-view';

/** 403: the role of the session cannot open the page it asked for (roleGuard sends here). */
@Component({
  selector: 'app-forbidden-page',
  imports: [MatButtonModule, MatIconModule, StateView],
  template: `
    <div class="ap-container page">
      <button
        matIconButton
        type="button"
        class="back-icon"
        aria-label="Volver a la página anterior"
        (click)="back()"
      >
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
      </button>
      <h1 class="title">Sin permiso</h1>
      <section class="ap-card card">
        <app-state-view art="forbidden" message="No tienes permiso para acceder a esta vista.">
          <button matButton="filled" type="button" (click)="back()">Volver</button>
        </app-state-view>
      </section>
    </div>
  `,
  styleUrl: './error-pages.scss',
})
export class ForbiddenPage {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly store = inject(AuthStore);

  /** Previous page of the app, or the home of the role when the page was opened directly. */
  protected back(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
      return;
    }
    const role = this.store.role();
    void this.router.navigateByUrl(role ? this.auth.homeFor(role) : '/inicio');
  }
}
