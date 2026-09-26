import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProposalStatus } from '../../../core/models/proposal.model';

const STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<ProposalStatus>();
  readonly label = input<string>();

  readonly displayLabel = computed(() => this.label() ?? STATUS_LABELS[this.status()]);
}