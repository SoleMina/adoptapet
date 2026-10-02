import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'pets',
    title: 'Catálogo de mascotas',
    loadComponent: () => import('./pet-catalog/pet-catalog').then((m) => m.PetCatalog),
  },
  {
    path: 'pets/:id',
    title: 'Detalle de mascota',
    loadComponent: () => import('./pet-detail/pet-detail').then((m) => m.PetDetail),
  },
];
