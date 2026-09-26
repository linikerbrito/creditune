import { Routes } from '@angular/router';
import { proposalResolver } from '../../core/resolvers/proposal.resolver';

export const ANALYST_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./analyst-dashboard/analyst-dashboard.component')
      .then((module) => module.AnalystDashboardComponent),
  },
  {
    path: 'proposals/:id',
    pathMatch: 'full',
    loadComponent: () => import('./proposal-review/proposal-review.component')
      .then((module) => module.ProposalReviewComponent),
    resolve: { proposal: proposalResolver },
  },
];