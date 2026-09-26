import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Proposal, ProposalStatus } from '../../../core/models/proposal.model';

type TimelineState = 'complete' | 'current' | 'upcoming' | 'not-applicable';

interface TimelineItem {
  status: ProposalStatus;
  label: string;
  description: string;
  state: TimelineState;
}

const TIMELINE_STEPS: ReadonlyArray<Pick<TimelineItem, 'status' | 'label' | 'description'>> = [
  { status: 'pending', label: 'Pendente', description: 'Proposta recebida e aguardando análise.' },
  { status: 'in_review', label: 'Em análise', description: 'A equipe está avaliando os dados da proposta.' },
  { status: 'approved', label: 'Aprovado', description: 'Crédito aprovado após a análise.' },
  { status: 'rejected', label: 'Rejeitado', description: 'A análise foi concluída sem aprovação.' },
];

const STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const STATUS_MESSAGES: Record<ProposalStatus, string> = {
  pending: 'Sua proposta foi recebida e está aguardando a análise da equipe.',
  in_review: 'Sua proposta está sendo avaliada. Acompanhe esta página para ver atualizações.',
  approved: 'Sua proposta foi aprovada. Consulte as condições e orientações com a equipe responsável.',
  rejected: 'A análise da sua proposta foi concluída. Consulte a justificativa registrada pela equipe.',
};

@Component({
  selector: 'app-proposal-tracking',
  imports: [RouterLink],
  templateUrl: './proposal-tracking.component.html',
  styleUrl: './proposal-tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalTrackingComponent {
  private readonly route = inject(ActivatedRoute);

  readonly proposal = toSignal(
    this.route.data.pipe(map((data) => data['proposal'] as Proposal | undefined)),
    { initialValue: undefined },
  );

  readonly timeline = computed<TimelineItem[]>(() => {
    const proposal = this.proposal();
    if (!proposal) {
      return [];
    }

    const stageByStatus: Record<ProposalStatus, number> = {
      pending: 0,
      in_review: 1,
      approved: 2,
      rejected: 2,
    };
    const currentStage = stageByStatus[proposal.status];
    const isFinalDecision = proposal.status === 'approved' || proposal.status === 'rejected';

    return TIMELINE_STEPS.map((step, index) => {
      let state: TimelineState;

      if (step.status === proposal.status) {
        state = 'current';
      } else if (isFinalDecision && (index === 2 || index === 3)) {
        state = 'not-applicable';
      } else if (index < currentStage) {
        state = 'complete';
      } else {
        state = 'upcoming';
      }

      return { ...step, state };
    });
  });

  get statusLabel(): string {
    const proposal = this.proposal();
    return proposal ? STATUS_LABELS[proposal.status] : '';
  }

  get statusMessage(): string {
    const proposal = this.proposal();
    return proposal ? STATUS_MESSAGES[proposal.status] : '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(value));
  }
}