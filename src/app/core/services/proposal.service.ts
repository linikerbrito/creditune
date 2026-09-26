import { Injectable, signal } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { NewProposal, Proposal, ProposalStatus } from '../models/proposal.model';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private readonly proposalsState = signal<Proposal[]>([
    {
      id: 'proposal-1001',
      applicantId: 'client-1',
      applicantName: 'Camila Cliente',
      requestedAmount: 12000,
      termMonths: 24,
      monthlyIncome: 5200,
      status: 'pending',
      createdAt: '2026-09-20T10:00:00.000Z',
      creditScore: 742,
    },
    {
      id: 'proposal-1002',
      applicantId: 'client-2',
      applicantName: 'Rafael Lima',
      requestedAmount: 25000,
      termMonths: 36,
      monthlyIncome: 7800,
      status: 'in_review',
      createdAt: '2026-09-22T14:30:00.000Z',
      creditScore: 681,
    },
  ]);
  private nextId = 1003;

  readonly proposals = this.proposalsState.asReadonly();

  getAll(): Observable<Proposal[]> {
    return of(this.proposalsState().map((proposal) => ({ ...proposal }))).pipe(delay(150));
  }

  getById(id: string): Observable<Proposal | undefined> {
    return of(this.proposalsState().find((proposal) => proposal.id === id)).pipe(
      map((proposal) => proposal ? { ...proposal } : undefined),
      delay(150),
    );
  }

  getByApplicant(applicantId: string): Observable<Proposal[]> {
    return this.getAll().pipe(
      map((proposals) => proposals.filter((proposal) => proposal.applicantId === applicantId)),
    );
  }

  create(input: NewProposal): Observable<Proposal> {
    const proposal: Proposal = {
      ...input,
      id: `proposal-${this.nextId++}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return of(proposal).pipe(
      delay(150),
      map((createdProposal) => {
        this.proposalsState.update((proposals) => [...proposals, createdProposal]);
        return { ...createdProposal };
      }),
    );
  }

  updateDecision(id: string, status: Extract<ProposalStatus, 'approved' | 'rejected'>, analystNote: string): Observable<Proposal | undefined> {
    let updatedProposal: Proposal | undefined;

    return of(null).pipe(
      delay(150),
      map(() => {
        this.proposalsState.update((proposals) => proposals.map((proposal) => {
          if (proposal.id !== id) {
            return proposal;
          }

          updatedProposal = { ...proposal, status, analystNote };
          return updatedProposal;
        }));
        return updatedProposal ? { ...updatedProposal } : undefined;
      }),
    );
  }
}