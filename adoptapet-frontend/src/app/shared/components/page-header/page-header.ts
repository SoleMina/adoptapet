import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';

/** Breadcrumb + greeting row, page title and subtitle (top of every Figma screen). */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  private readonly auth = inject(AuthStore);

  readonly heading = input.required<string>();
  /** Last breadcrumb item; defaults to the heading. */
  readonly crumb = input<string>();
  readonly subtitle = input<string>();

  protected readonly crumbText = computed(() => this.crumb() ?? this.heading());
  protected readonly greeting = computed(() => {
    const user = this.auth.user();
    return user ? `Hola, ${user.firstName}` : 'Bienvenido';
  });
}
