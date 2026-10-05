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
import { UnreadNotifications } from '@core/notifications/unread-notifications';
import { Loading } from '@core/ui/loading';
import { initialsOf } from '@shared/utils/initials';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { filter, map } from 'rxjs';

interface NavLink {
  label: string;
  path: string;
  active: boolean;
  /** Small counter next to the label (unread notifications). */
  badge?: number;
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
  private readonly unread = inject(UnreadNotifications);
  protected readonly roleLabel = ROLE_LABEL;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly initials = computed(() => initialsOf(this.store.user() ?? {}));

  protected readonly profilePath = computed(() =>
    this.store.isStaff() ? '/staff/profile' : '/profile',
  );

  private readonly route = computed(() => this.url().split(/[?#]/)[0]);

  /** Left side of the bar. */
  protected readonly links = computed<NavLink[]>(() => {
    const route = this.route();
    const links: NavLink[] = [
      { label: 'Inicio', path: '/inicio', active: route === '/inicio' },
      { label: 'Mascotas', path: '/pets', active: route.startsWith('/pets') },
    ];
    if (this.store.isAdopter()) {
      links.push(
        {
          label: 'Mis solicitudes',
          path: '/my-applications',
          active: route.startsWith('/my-applications') || route.startsWith('/apply'),
        },
        {
          label: 'Notificaciones',
          path: '/notifications',
          active: route.startsWith('/notifications'),
          badge: this.unread.count(),
        },
      );
    } else if (this.store.isStaff()) {
      links.push({ label: 'Panel', path: '/staff/dashboard', active: false });
    }
    return links;
  });

  /** Right side for visitors: "Iniciar sesión" and the "Crear cuenta" button. */
  protected readonly loginActive = computed(() => this.route().startsWith('/login'));
  protected readonly registerActive = computed(() => this.route().startsWith('/register'));

  /** The mobile menu holds everything: left links plus the visitor actions. */
  protected readonly menuLinks = computed<NavLink[]>(() =>
    this.store.isAuthenticated()
      ? this.links()
      : [
          ...this.links(),
          { label: 'Iniciar sesión', path: '/login', active: this.loginActive() },
          { label: 'Crear cuenta', path: '/register', active: this.registerActive() },
        ],
  );

  protected logout(): void {
    this.auth.logout();
  }
}
