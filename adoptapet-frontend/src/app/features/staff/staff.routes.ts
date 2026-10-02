import { Routes } from '@angular/router';
import { roleGuard, withRoles } from '@core/auth/auth-guards';

const comingSoon = () =>
  import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

/** WORKER and ADMIN panel (authGuard + roleGuard are on the parent route). */
export const STAFF_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: comingSoon,
    data: { heading: 'Dashboard' },
  },
  {
    path: 'applications',
    title: 'Solicitudes',
    loadComponent: comingSoon,
    data: { heading: 'Solicitudes' },
  },
  {
    path: 'applications/:id',
    title: 'Revisión de solicitud',
    loadComponent: comingSoon,
    data: { heading: 'Revisión de solicitud' },
  },
  { path: 'pets', title: 'Mascotas', loadComponent: comingSoon, data: { heading: 'Mascotas' } },
  {
    path: 'delivery-calendar',
    title: 'Agenda de entregas',
    loadComponent: comingSoon,
    data: { heading: 'Agenda de entregas' },
  },
  {
    path: 'adopters',
    title: 'Adoptantes',
    loadComponent: comingSoon,
    data: { heading: 'Adoptantes' },
  },
  {
    path: 'adopters/:id',
    title: 'Detalle de adoptante',
    loadComponent: comingSoon,
    data: { heading: 'Detalle de adoptante' },
  },
  {
    path: 'profile',
    title: 'Mi perfil',
    loadComponent: comingSoon,
    data: { heading: 'Mi perfil' },
  },
  {
    path: '',
    canActivate: [roleGuard],
    data: withRoles('ADMIN'),
    children: [
      {
        path: 'workers',
        title: 'Trabajadores',
        loadComponent: comingSoon,
        data: { heading: 'Trabajadores' },
      },
      {
        path: 'users',
        title: 'Usuarios',
        loadComponent: comingSoon,
        data: { heading: 'Usuarios' },
      },
      {
        path: 'reports',
        title: 'Reportes',
        loadComponent: comingSoon,
        data: { heading: 'Reporte general' },
      },
    ],
  },
];
