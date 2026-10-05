import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { Role } from '@core/models/user';
import { Loading } from '@core/ui/loading';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { UserMenu } from '@shared/components/user-menu/user-menu';
import { filter, map, startWith } from 'rxjs';

interface StaffLink {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

const STAFF: Role[] = ['ADMIN', 'WORKER'];
const ADMIN: Role[] = ['ADMIN'];

const LINKS: StaffLink[] = [
  { label: 'Panel', icon: 'home', path: '/staff/dashboard', roles: STAFF },
  { label: 'Mascotas', icon: 'pets', path: '/staff/pets', roles: STAFF },
  { label: 'Solicitudes', icon: 'description', path: '/staff/applications', roles: STAFF },
  {
    label: 'Agenda de entregas',
    icon: 'calendar_month',
    path: '/staff/delivery-calendar',
    roles: STAFF,
  },
  { label: 'Adoptantes', icon: 'group', path: '/staff/adopters', roles: STAFF },
  { label: 'Usuarios', icon: 'person', path: '/staff/users', roles: STAFF },
  { label: 'Trabajadores', icon: 'badge', path: '/staff/workers', roles: ADMIN },
  { label: 'Reportes', icon: 'bar_chart', path: '/staff/reports', roles: ADMIN },
  { label: 'Mi perfil', icon: 'settings', path: '/staff/profile', roles: STAFF },
];

/** Panel for WORKER and ADMIN: side menu (fixed on desktop, drawer on phones) + top bar. */
@Component({
  selector: 'app-staff-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSidenavModule,
    ThemeToggle,
    UserMenu,
  ],
  templateUrl: './staff-layout.html',
  styleUrl: './staff-layout.scss',
})
export class StaffLayout {
  private readonly auth = inject(Auth);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly loading = inject(Loading);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 899.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly links = computed(() => {
    const role = this.store.role();
    return LINKS.filter((link) => !!role && link.roles.includes(role));
  });

  /** Title of the current page (route `title`), for the breadcrumb. */
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => deepestTitle(this.router.routerState.snapshot.root)),
    ),
    { initialValue: '' },
  );

  protected logout(): void {
    this.auth.logout();
  }
}

function deepestTitle(route: ActivatedRouteSnapshot): string {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return current.title ?? '';
}
