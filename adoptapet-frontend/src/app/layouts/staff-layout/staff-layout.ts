import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { ROLE_LABEL } from '@core/i18n/labels';
import { Role } from '@core/models/user';
import { Loading } from '@core/ui/loading';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { map } from 'rxjs';

interface StaffLink {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

const STAFF: Role[] = ['ADMIN', 'WORKER'];
const ADMIN: Role[] = ['ADMIN'];

const LINKS: StaffLink[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/staff/dashboard', roles: STAFF },
  { label: 'Solicitudes', icon: 'assignment', path: '/staff/applications', roles: STAFF },
  { label: 'Mascotas', icon: 'pets', path: '/staff/pets', roles: STAFF },
  { label: 'Agenda de entregas', icon: 'event', path: '/staff/delivery-calendar', roles: STAFF },
  { label: 'Adoptantes', icon: 'group', path: '/staff/adopters', roles: STAFF },
  { label: 'Trabajadores', icon: 'badge', path: '/staff/workers', roles: ADMIN },
  { label: 'Usuarios', icon: 'manage_accounts', path: '/staff/users', roles: ADMIN },
  { label: 'Reportes', icon: 'description', path: '/staff/reports', roles: ADMIN },
];

/** Panel for WORKER and ADMIN: side menu (fixed on desktop, drawer on mobile) + top bar. */
@Component({
  selector: 'app-staff-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    ThemeToggle,
  ],
  templateUrl: './staff-layout.html',
  styleUrl: './staff-layout.scss',
})
export class StaffLayout {
  private readonly auth = inject(Auth);
  protected readonly store = inject(AuthStore);
  protected readonly loading = inject(Loading);
  protected readonly roleLabel = ROLE_LABEL;

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

  protected logout(): void {
    this.auth.logout();
  }
}
