import { Routes } from '@angular/router';
import { analystGuard } from './core/guards/analyst.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'client' },
  {
    path: 'client',
    loadChildren: () => import('./features/client/client.routes')
      .then((module) => module.CLIENT_ROUTES),
  },
  {
    path: 'analyst',
    canActivate: [authGuard, analystGuard],
    loadChildren: () => import('./features/analyst/analyst.routes')
      .then((module) => module.ANALYST_ROUTES),
  },
  { path: '**', redirectTo: 'client' },
];