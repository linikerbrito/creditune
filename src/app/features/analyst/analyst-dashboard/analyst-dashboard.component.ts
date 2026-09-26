import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProposalStatus } from '../../../core/models/proposal.model';
import { ProposalService } from '../../../core/services/proposal.service';

type StatusFilter = ProposalStatus | 'all';

const STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

@Component({
  selector: 'app-analyst-dashboard',
  imports: [RouterLink],
  templateUrl: './analyst-dashboard.component.html',
  styleUrl: './analyst-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalystDashboardComponent {
  private readonly proposalService = inject(ProposalService);

  readonly statusFilter = signal<StatusFilter>('pending');
  readonly minimumAmount = signal<number | null>(null);
  readonly maximumAmount = signal<number | null>(null);
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(8);

  readonly pendingCount = computed(() =>
    this.proposalService.proposals().filter((proposal) => proposal.status === 'pending').length,
  );

  readonly filteredProposals = computed(() => {
    const status = this.statusFilter();
    const minimum = this.minimumAmount();
    const maximum = this.maximumAmount();
    const start = this.startDate();
    const end = this.endDate();

    return this.proposalService.proposals().filter((proposal) => {
      const proposalDate = proposal.createdAt.slice(0, 10);
      return (status === 'all' || proposal.status === status)
        && (minimum === null || proposal.requestedAmount >= minimum)
        && (maximum === null || proposal.requestedAmount <= maximum)
        && (!start || proposalDate >= start)
        && (!end || proposalDate <= end);
    });
  });

  readonly totalPages = computed(() => Math.max(
    1,
    Math.ceil(this.filteredProposals().length / this.pageSize()),
  ));

  readonly displayedPage = computed(() => Math.min(this.currentPage(), this.totalPages()));

  readonly visibleProposals = computed(() => {
    const startIndex = (this.displayedPage() - 1) * this.pageSize();
    return this.filteredProposals().slice(startIndex, startIndex + this.pageSize());
  });

  readonly resultRange = computed(() => {
    const total = this.filteredProposals().length;
    if (total === 0) {
      return 'Nenhuma proposta encontrada';
    }

    const first = (this.displayedPage() - 1) * this.pageSize() + 1;
    const last = Math.min(first + this.pageSize() - 1, total);
    return `Exibindo ${first}-${last} de ${total} propostas`;
  });

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
    this.resetPage();
  }

  onMinimumAmountChange(event: Event): void {
    this.minimumAmount.set(this.readNumber(event));
    this.resetPage();
  }

  onMaximumAmountChange(event: Event): void {
    this.maximumAmount.set(this.readNumber(event));
    this.resetPage();
  }

  onStartDateChange(event: Event): void {
    this.startDate.set((event.target as HTMLInputElement).value);
    this.resetPage();
  }

  onEndDateChange(event: Event): void {
    this.endDate.set((event.target as HTMLInputElement).value);
    this.resetPage();
  }

  clearFilters(): void {
    this.statusFilter.set('pending');
    this.minimumAmount.set(null);
    this.maximumAmount.set(null);
    this.startDate.set('');
    this.endDate.set('');
    this.resetPage();
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }

  statusLabel(status: ProposalStatus): string {
    return STATUS_LABELS[status];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
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

  private readNumber(event: Event): number | null {
    const value = (event.target as HTMLInputElement).value;
    if (value === '') {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  private resetPage(): void {
    this.currentPage.set(1);
  }
}