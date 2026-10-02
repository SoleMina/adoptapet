import { Component } from '@angular/core';

/** Loading placeholder with the shape of a pet card. */
@Component({
  selector: 'app-pet-card-skeleton',
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="block photo"></div>
    <div class="block line title"></div>
    <div class="block line"></div>
    <div class="block line short"></div>
    <div class="block button"></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ap-space-3);
      padding: var(--ap-space-4);
      border: 1px solid var(--ap-color-border);
      border-radius: var(--ap-radius-lg);
    }

    .block {
      border-radius: var(--ap-radius-sm);
      background: linear-gradient(
        90deg,
        var(--ap-color-primary-soft) 25%,
        var(--ap-color-page) 50%,
        var(--ap-color-primary-soft) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .photo {
      aspect-ratio: 4 / 3.3;
    }

    .line {
      height: 12px;
      width: 70%;
    }

    .title {
      height: 20px;
      width: 45%;
      margin-top: var(--ap-space-1);
    }

    .short {
      width: 40%;
    }

    .button {
      height: var(--ap-button-height);
    }

    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
  `,
})
export class PetCardSkeleton {}
