import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { ROLE_LABEL } from '@core/i18n/labels';
import { Loading } from '@core/ui/loading';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { filter, map } from 'rxjs';

interface NavLink {
  label: string;
  path: string;
  active: boolean;
}

/** Visitor and adopter area: top bar from the Figma + content. */
@Component({
  selector: 'app-site-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    ThemeToggle,
  ],
  templateUrl: './site-layout.html',
  styleUrl: './site-layout.scss',
})
export class SiteLayout {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  protected readonly store = inject(AuthStore);
  protected readonly loading = inject(Loading);
  protected readonly roleLabel = ROLE_LABEL;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly profilePath = computed(() =>
    this.store.isStaff() ? '/staff/profile' : '/profile',
  );

  protected readonly links = computed<NavLink[]>(() => {
    const route = this.url().split(/[?#]/)[0];
    const links: NavLink[] = [
      { label: 'Inicio', path: '/inicio', active: route === '/inicio' },
      { label: 'Mascotas', path: '/pets', active: route.startsWith('/pets') }
    ];
    if (this.store.isAdopter()) {
      links.push(
        {
          label: 'Mis solicitudes',
          path: '/my-applications',
          active: route.startsWith('/my-applications'),
        },
        {
          label: 'Notificaciones',
          path: '/notifications',
          active: route.startsWith('/notifications'),
        },
      );
    } else if (this.store.isStaff()) {
      links.push({ label: 'Panel', path: '/staff/dashboard', active: false });
    } else {
      links.push(
        { label: 'Iniciar sesión', path: '/login', active: route.startsWith('/login') },
        { label: 'Crear cuenta', path: '/register', active: route.startsWith('/register') },
      );
    }
    return links;
  });

  protected logout(): void {
    this.auth.logout();
  }
}
