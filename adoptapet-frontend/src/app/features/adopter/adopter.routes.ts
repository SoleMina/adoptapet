import { Routes } from '@angular/router';

const comingSoon = () =>
  import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

/** Adopter area. Screens not built yet use ComingSoon with their final route, title and guard. */
export const ADOPTER_ROUTES: Routes = [
  {
    path: 'my-applications',
    title: 'Mis solicitudes',
    loadComponent: () => import('./my-applications/my-applications').then((m) => m.MyApplications),
  },
  {
    path: 'my-applications/:id',
    title: 'Detalle de solicitud',
    loadComponent: comingSoon,
    data: { heading: 'Detalle de solicitud' },
  },
  {
    path: 'apply/:petId',
    title: 'Solicitud de adopción',
    loadComponent: () => import('./apply/apply').then((m) => m.Apply),
  },
  {
    path: 'notifications',
    title: 'Notificaciones',
    loadComponent: comingSoon,
    data: { heading: 'Notificaciones' },
  },
  {
    path: 'profile',
    title: 'Mi perfil',
    loadComponent: comingSoon,
    data: { heading: 'Mi perfil' },
  },
];
