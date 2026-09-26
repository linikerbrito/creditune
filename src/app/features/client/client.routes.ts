import { Routes } from '@angular/router';
import { proposalResolver } from '../../core/resolvers/proposal.resolver';

export const CLIENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'proposals' },
  {
    path: 'proposals/new',
    pathMatch: 'full',
    loadComponent: () => import('./proposal-form/proposal-form.component')
      .then((module) => module.ProposalFormComponent),
  },
  {
    path: 'proposals/:id',
    pathMatch: 'full',
    loadComponent: () => import('./proposal-tracking/proposal-tracking.component')
      .then((module) => module.ProposalTrackingComponent),
    resolve: { proposal: proposalResolver },
  },
  {
    path: 'proposals',
    pathMatch: 'full',
    loadComponent: () => import('./proposal-list/proposal-list.component')
      .then((module) => module.ProposalListComponent),
  },
];