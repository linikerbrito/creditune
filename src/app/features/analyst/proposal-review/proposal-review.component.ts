import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, map } from 'rxjs';
import { Proposal, ProposalStatus } from '../../../core/models/proposal.model';
import { ProposalService } from '../../../core/services/proposal.service';

type DecisionState = 'idle' | 'saving' | 'success' | 'error';

const STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

const nonBlankValidator = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim().length > 0 ? null : { required: true };

@Component({
  selector: 'app-proposal-review',
  imports: [ReactiveFormsModule],
  templateUrl: './proposal-review.component.html',
  styleUrl: './proposal-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalReviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly proposalService = inject(ProposalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly proposal = toSignal(
    this.route.data.pipe(map((data) => data['proposal'] as Proposal | undefined)),
    { initialValue: undefined },
  );
  readonly decisionStatus = signal<ProposalStatus | null>(null);
  readonly savedNote = signal<string | null>(null);
  readonly confirmRejection = signal(false);
  readonly decisionState = signal<DecisionState>('idle');
  readonly currentStatus = computed(() => this.decisionStatus() ?? this.proposal()?.status ?? null);
  readonly currentAnalystNote = computed(() => this.savedNote() ?? this.proposal()?.analystNote ?? null);
  readonly canDecide = computed(() => {
    const status = this.currentStatus();
    return status === 'pending' || status === 'in_review';
  });

  readonly rejectionForm = new FormGroup({
    analystNote: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nonBlankValidator],
    }),
  });

  statusLabel(status: ProposalStatus): string {
    return STATUS_LABELS[status];
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

  beginRejection(): void {
    this.confirmRejection.set(true);
    this.decisionState.set('idle');
  }

  cancelRejection(): void {
    this.confirmRejection.set(false);
    this.rejectionForm.reset();
    this.decisionState.set('idle');
  }

  approve(): void {
    this.saveDecision('approved', '');
  }

  reject(): void {
    this.rejectionForm.markAllAsTouched();
    if (this.rejectionForm.invalid) {
      return;
    }

    this.saveDecision('rejected', this.rejectionForm.controls.analystNote.value.trim());
  }

  private saveDecision(status: 'approved' | 'rejected', analystNote: string): void {
    const proposal = this.proposal();
    if (!proposal || !this.canDecide()) {
      return;
    }

    this.decisionState.set('saving');
    this.proposalService.updateDecision(proposal.id, status, analystNote).pipe(
      finalize(() => {
        if (this.decisionState() === 'saving') {
          this.decisionState.set('idle');
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updatedProposal) => {
        if (!updatedProposal) {
          this.decisionState.set('error');
          return;
        }

        this.decisionStatus.set(updatedProposal.status);
        this.savedNote.set(updatedProposal.analystNote ?? null);
        this.confirmRejection.set(false);
        this.decisionState.set('success');
      },
      error: () => this.decisionState.set('error'),
    });
  }
}