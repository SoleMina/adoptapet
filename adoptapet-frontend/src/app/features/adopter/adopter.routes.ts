import { Routes } from '@angular/router';

/** Adopter area (authGuard + roleGuard are on the parent route). */
export const ADOPTER_ROUTES: Routes = [
  {
    path: 'my-applications',
    title: 'Mis solicitudes',
    loadComponent: () => import('./my-applications/my-applications').then((m) => m.MyApplications),
  },
  {
    path: 'my-applications/:id',
    title: 'Detalle de solicitud',
    loadComponent: () =>
      import('./application-detail/application-detail').then((m) => m.ApplicationDetail),
  },
  {
    path: 'apply/:petId',
    title: 'Solicitud de adopción',
    loadComponent: () => import('./apply/apply').then((m) => m.Apply),
  },
  {
    path: 'notifications',
    title: 'Notificaciones',
    loadComponent: () => import('./notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'profile',
    title: 'Mi perfil',
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
];
