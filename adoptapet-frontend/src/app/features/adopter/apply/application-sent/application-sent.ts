import { Component, afterNextRender, ElementRef, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApplicationResponse } from '@core/models/application';
import { PetResponse } from '@core/models/pet';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { StatusBadge } from '@shared/components/status-badge/status-badge';

/** Confirmation after sending an application: pet, "Pendiente de revisión" and the next actions. */
@Component({
  selector: 'app-application-sent',
  imports: [MatButtonModule, MatIconModule, RouterLink, PetPhoto, StatusBadge],
  templateUrl: './application-sent.html',
  styleUrl: './application-sent.scss',
  host: { class: 'panel', role: 'status', 'aria-labelledby': 'sent-title' },
})
export class ApplicationSent {
  readonly pet = input.required<PetResponse>();
  readonly application = input.required<ApplicationResponse>();

  constructor() {
    // Announce the result: move the focus to the title.
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => host.nativeElement.querySelector<HTMLElement>('#sent-title')?.focus());
  }
}
