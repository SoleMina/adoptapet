import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { imageUrl } from '@core/http/api-url';

/** Pet picture with a placeholder when it has no photo or the image fails to load. */
@Component({
  selector: 'app-pet-photo',
  imports: [NgOptimizedImage, MatIconModule],
  template: `
    @if (src() && !failed()) {
      <img
        [ngSrc]="src()!"
        [alt]="'Foto de ' + name()"
        fill
        [priority]="priority()"
        (error)="failed.set(true)"
      />
    } @else {
      <div class="placeholder" role="img" [attr.aria-label]="name() + ' (sin foto)'">
        <mat-icon aria-hidden="true">pets</mat-icon>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      aspect-ratio: var(--pet-photo-ratio, 4 / 3.3);
      border-radius: var(--ap-radius-sm);
      background-color: var(--ap-color-primary-soft);
    }

    img {
      object-fit: cover;
    }

    .placeholder {
      display: grid;
      place-items: center;
      height: 100%;
      color: var(--ap-color-primary);

      .mat-icon {
        width: 56px;
        height: 56px;
        font-size: 56px;
      }
    }
  `,
})
export class PetPhoto {
  /** `imageUrl` as it comes from the API (relative to the gateway). */
  readonly path = input<string | null>(null);
  readonly name = input.required<string>();
  /** true for the first, above-the-fold image (LCP). */
  readonly priority = input(false);

  protected readonly src = computed(() => imageUrl(this.path()));
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
