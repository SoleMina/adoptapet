import { Routes } from '@angular/router';

const comingSoon = () =>
  import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

/** Adopter area. Screens not built yet use ComingSoon with their final route, title and guard. */
export const ADOPTER_ROUTES: Routes = [
  {
    path: 'my-applications',
    title: 'Mis solicitudes',
    loadComponent: comingSoon,
    data: {
      heading: 'Mis solicitudes',
      description: 'El estado de tus postulaciones y tus citas de entrega.',
    },
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
    loadComponent: comingSoon,
    data: {
      heading: 'Solicitud de adopción',
      description: 'Formulario y documentos para adoptar.',
    },
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
