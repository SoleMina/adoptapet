import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { StateView } from '@shared/components/state-view/state-view';

/** 404: the address does not exist. */
@Component({
  selector: 'app-error-page',
  imports: [MatButtonModule, RouterLink, StateView],
  template: `
    <div class="ap-container page">
      <h1 class="title">Página no encontrada</h1>
      <section class="ap-card card">
        <app-state-view art="search" message="La dirección que buscas no existe o fue movida.">
          <a matButton="filled" routerLink="/inicio">Ir al inicio</a>
        </app-state-view>
      </section>
    </div>
  `,
  styleUrl: './error-pages.scss',
})
export class ErrorPage {}
