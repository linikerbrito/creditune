import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProposalService } from '../../../core/services/proposal.service';

@Component({
  selector: 'app-proposal-list',
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './proposal-list.component.html',
  styleUrl: './proposal-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalListComponent {
  private readonly proposalService = inject(ProposalService);
  private readonly authService = inject(AuthService);

  readonly proposals = computed(() => {
    const activeUser = this.authService.user();
    const proposals = this.proposalService.proposals();
    const clientProposals = activeUser?.role === 'client'
      ? proposals.filter((proposal) => proposal.applicantId === activeUser.id)
      : proposals;

    return [...clientProposals].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
  });

  readonly pendingCount = computed(() =>
    this.proposals().filter((proposal) => proposal.status === 'pending').length,
  );

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value));
  }
}