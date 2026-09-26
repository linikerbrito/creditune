import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Proposal } from '../models/proposal.model';
import { ProposalService } from '../services/proposal.service';

export const proposalResolver: ResolveFn<Proposal | undefined> = (route) => {
  const id = route.paramMap.get('id');
  return inject(ProposalService).getById(id ?? '');
};