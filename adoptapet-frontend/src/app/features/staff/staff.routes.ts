import { Routes } from '@angular/router';
import { roleGuard, withRoles } from '@core/auth/auth-guards';

/** One form for the three ADMIN screens; `data.mode` says which one. */
const userForm = () => import('./users/user-form/user-form').then((m) => m.UserForm);

/** WORKER and ADMIN panel (authGuard + roleGuard are on the parent route). */
export const STAFF_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Panel',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'applications',
    title: 'Solicitudes',
    loadComponent: () =>
      import('./applications/application-list/application-list').then((m) => m.ApplicationList),
  },
  {
    path: 'applications/:id',
    title: 'Revisión de solicitud',
    loadComponent: () =>
      import('./applications/application-review/application-review').then(
        (m) => m.ApplicationReview,
      ),
  },
  {
    path: 'pets',
    title: 'Mascotas',
    loadComponent: () => import('./pets/pet-list/pet-list').then((m) => m.PetList),
  },
  {
    path: 'pets/new',
    title: 'Registrar mascota',
    loadComponent: () => import('./pets/pet-form/pet-form').then((m) => m.PetForm),
  },
  {
    path: 'pets/:id/edit',
    title: 'Editar mascota',
    loadComponent: () => import('./pets/pet-form/pet-form').then((m) => m.PetForm),
  },
  {
    path: 'delivery-calendar',
    title: 'Agenda de entregas',
    loadComponent: () =>
      import('./delivery-calendar/delivery-calendar').then((m) => m.DeliveryCalendar),
  },
  {
    path: 'adopters',
    title: 'Adoptantes',
    loadComponent: () => import('./adopters/adopter-list/adopter-list').then((m) => m.AdopterList),
  },
  {
    path: 'adopters/:id',
    title: 'Detalle del adoptante',
    loadComponent: () =>
      import('./adopters/adopter-detail/adopter-detail').then((m) => m.AdopterDetail),
  },
  {
    path: 'users',
    title: 'Usuarios',
    loadComponent: () => import('./users/user-list/user-list').then((m) => m.UserList),
  },
  {
    path: 'profile',
    title: 'Mi perfil',
    loadComponent: () => import('./profile/staff-profile').then((m) => m.StaffProfile),
  },
  {
    path: '',
    canActivate: [roleGuard],
    data: withRoles('ADMIN'),
    children: [
      {
        path: 'workers',
        title: 'Trabajadores',
        loadComponent: () => import('./workers/worker-list/worker-list').then((m) => m.WorkerList),
      },
      {
        path: 'workers/new',
        title: 'Crear trabajador',
        loadComponent: userForm,
        data: { mode: 'create-worker' },
      },
      {
        path: 'workers/:id/edit',
        title: 'Editar trabajador',
        loadComponent: userForm,
        data: { mode: 'edit-worker' },
      },
      {
        path: 'users/:id/edit',
        title: 'Editar usuario',
        loadComponent: userForm,
        data: { mode: 'edit-user' },
      },
      {
        path: 'reports',
        title: 'Reportes',
        loadComponent: () => import('./reports/reports').then((m) => m.Reports),
      },
    ],
  },
];
