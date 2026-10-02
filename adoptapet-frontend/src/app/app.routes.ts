import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, withRoles } from '@core/auth/auth-guards';
import { SiteLayout } from '@layouts/site-layout/site-layout';

const errorPage = () => import('@features/errors/error-page').then((m) => m.ErrorPage);

export const routes: Routes = [
  {
    // Visitor and adopter pages share the top bar of the Figma.
    path: '',
    component: SiteLayout,
    children: [
      {
        path: '',
        loadChildren: () => import('@features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
      },
      {
        path: '',
        canActivate: [guestGuard],
        loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
      {
        path: '',
        canActivate: [authGuard, roleGuard],
        data: withRoles('ADOPTER'),
        loadChildren: () =>
          import('@features/adopter/adopter.routes').then((m) => m.ADOPTER_ROUTES),
      },
      {
        path: 'forbidden',
        title: 'Sin permiso',
        loadComponent: errorPage,
        data: {
          icon: 'lock',
          heading: 'No tienes permiso para ver esta página',
          message: 'Tu cuenta no tiene acceso a esta sección.',
        },
      },
    ],
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard],
    data: withRoles('ADMIN', 'WORKER'),
    loadComponent: () => import('@layouts/staff-layout/staff-layout').then((m) => m.StaffLayout),
    loadChildren: () => import('@features/staff/staff.routes').then((m) => m.STAFF_ROUTES),
  },
  {
    path: '**',
    component: SiteLayout,
    children: [{ path: '**', title: 'Página no encontrada', loadComponent: errorPage }],
  },
];
