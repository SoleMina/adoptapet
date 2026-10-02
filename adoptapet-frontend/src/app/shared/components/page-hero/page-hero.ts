import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';

/**
 * Big page header of the home and the catalog: breadcrumb, greeting chip, title, subtitle and a soft
 * background with waves. The next block of the page climbs over its bottom by `--hero-overlap`
 * (set the same value as a negative margin-top on it).
 *
 * Projection: default content goes under the subtitle; `[heroArt]` goes on the right side.
 */
@Component({
  selector: 'app-page-hero',
  imports: [MatIconModule, RouterLink],
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
})
export class PageHero {
  private readonly auth = inject(AuthStore);

  readonly heading = input.required<string>();
  /** Last breadcrumb item; defaults to the heading. */
  readonly crumb = input<string>();
  readonly subtitle = input<string>();
  /** Paws and sparkles on the right (turn off when the page projects its own art). */
  readonly decorated = input(true);

  protected readonly crumbText = computed(() => this.crumb() ?? this.heading());
  protected readonly greeting = computed(() => {
    const user = this.auth.user();
    return user ? `Hola, ${user.firstName}` : 'Bienvenido';
  });
}
