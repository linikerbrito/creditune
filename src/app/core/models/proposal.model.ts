export type ProposalStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  applicantId: string;
  applicantName: string;
  requestedAmount: number;
  termMonths: number;
  monthlyIncome: number;
  status: ProposalStatus;
  createdAt: string;
  analystNote?: string;
  creditScore?: number;
}

export type NewProposal = Omit<Proposal, 'id' | 'status' | 'createdAt'>;