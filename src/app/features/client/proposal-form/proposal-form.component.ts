import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  EMPTY,
  Observable,
  combineLatest,
  debounceTime,
  delay,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProposalService } from '../../../core/services/proposal.service';

interface AdditionalIncomeControls {
  source: FormControl<string>;
  monthlyAmount: FormControl<number>;
}

type AdditionalIncomeForm = FormGroup<AdditionalIncomeControls>;

interface ApplicantControls {
  fullName: FormControl<string>;
  cpf: FormControl<string>;
  email: FormControl<string>;
  monthlyIncome: FormControl<number>;
  additionalIncomes: FormArray<AdditionalIncomeForm>;
}

interface InstallmentSimulation {
  monthlyPayment: number;
  totalRepayment: number;
  termMonths: number;
  annualInterestRate: number;
}

const MINIMUM_MONTHLY_INCOME = 1500;
const ANNUAL_INTEREST_RATE = 0.18;
const MOCK_REGISTERED_CPFS = new Set(['52998224725']);

function minimumCombinedIncomeValidator(minimum: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const applicant = control as FormGroup<ApplicantControls>;
    const declaredIncome = applicant.controls.monthlyIncome.value;
    const additionalIncome = applicant.controls.additionalIncomes.controls.reduce(
      (total, income) => total + income.controls.monthlyAmount.value,
      0,
    );
    const totalIncome = declaredIncome + additionalIncome;

    return totalIncome >= minimum
      ? null
      : { minimumIncome: { minimum, actual: totalIncome } };
  };
}

function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (length: number): number => {
    const sum = Array.from(digits.slice(0, length)).reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0,
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(digits[9])
    && calculateDigit(10) === Number(digits[10]);
}

const cpfFormatValidator: ValidatorFn = (control) =>
  isValidCpf(String(control.value ?? '')) ? null : { cpfInvalid: true };

const cpfAvailabilityValidator: AsyncValidatorFn = (control): Observable<ValidationErrors | null> => {
  const digits = String(control.value ?? '').replace(/\D/g, '');

  return timer(800).pipe(
    map(() => MOCK_REGISTERED_CPFS.has(digits) ? { cpfAlreadyRegistered: true } : null),
  );
};

function calculateMonthlyPayment(amount: number, termMonths: number): number {
  const monthlyRate = ANNUAL_INTEREST_RATE / 12;
  const payment = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return Math.round(payment * 100) / 100;
}

@Component({
  selector: 'app-proposal-form',
  imports: [ReactiveFormsModule],
  templateUrl: './proposal-form.component.html',
  styleUrl: './proposal-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalFormComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly proposalService = inject(ProposalService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly simulation = signal<InstallmentSimulation | null>(null);
  readonly steps = [
    { number: 1, label: 'Dados e renda' },
    { number: 2, label: 'Crédito' },
    { number: 3, label: 'Revisão' },
  ] as const;

  readonly form = this.formBuilder.group({
    applicant: this.formBuilder.group({
      fullName: this.formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(3)],
      }),
      cpf: this.formBuilder.control('', {
        validators: [Validators.required, cpfFormatValidator],
        asyncValidators: [cpfAvailabilityValidator],
      }),
      email: this.formBuilder.control('', {
        validators: [Validators.required, Validators.email],
      }),
      monthlyIncome: this.formBuilder.control(0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      additionalIncomes: this.formBuilder.array<AdditionalIncomeForm>([]),
    }, { validators: [minimumCombinedIncomeValidator(MINIMUM_MONTHLY_INCOME)] }),
    loan: this.formBuilder.group({
      requestedAmount: this.formBuilder.control(10000, {
        validators: [Validators.required, Validators.min(1000), Validators.max(100000)],
      }),
      termMonths: this.formBuilder.control(24, {
        validators: [Validators.required, Validators.min(6), Validators.max(60)],
      }),
    }),
    review: this.formBuilder.group({
      consent: this.formBuilder.control(false, { validators: [Validators.requiredTrue] }),
    }),
  });

  constructor() {
    this.connectInstallmentSimulation();
  }

  get applicantGroup(): FormGroup<ApplicantControls> {
    return this.form.controls.applicant;
  }

  get additionalIncomes(): FormArray<AdditionalIncomeForm> {
    return this.applicantGroup.controls.additionalIncomes;
  }

  get totalMonthlyIncome(): number {
    const declaredIncome = this.applicantGroup.controls.monthlyIncome.value;
    return this.additionalIncomes.controls.reduce(
      (total, income) => total + income.controls.monthlyAmount.value,
      declaredIncome,
    );
  }

  addAdditionalIncome(): void {
    this.additionalIncomes.push(this.formBuilder.group({
      source: this.formBuilder.control('', { validators: [Validators.required] }),
      monthlyAmount: this.formBuilder.control(0, {
        validators: [Validators.required, Validators.min(1)],
      }),
    }));
  }

  removeAdditionalIncome(index: number): void {
    this.additionalIncomes.removeAt(index);
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      this.applicantGroup.markAllAsTouched();
      if (this.applicantGroup.invalid || this.applicantGroup.pending) {
        return;
      }
      this.currentStep.set(2);
      return;
    }

    if (this.currentStep() === 2) {
      this.form.controls.loan.markAllAsTouched();
      if (this.form.controls.loan.invalid) {
        return;
      }
      this.currentStep.set(3);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => (step - 1) as 1 | 2 | 3);
    }
  }

  submit(): void {
    this.submitError.set(null);

    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      if (this.applicantGroup.invalid) {
        this.currentStep.set(1);
      } else if (this.form.controls.loan.invalid) {
        this.currentStep.set(2);
      }
      return;
    }

    const { applicant, loan } = this.form.getRawValue();
    this.isSubmitting.set(true);

    this.proposalService.create({
      applicantId: this.authService.user()?.id ?? 'client-demo',
      applicantName: applicant.fullName.trim(),
      requestedAmount: loan.requestedAmount,
      termMonths: loan.termMonths,
      monthlyIncome: this.totalMonthlyIncome,
    }).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (proposal) => {
        void this.router.navigate(['/client/proposals', proposal.id]);
      },
      error: () => {
        this.submitError.set('Não foi possível enviar a proposta. Tente novamente.');
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private connectInstallmentSimulation(): void {
    const { requestedAmount, termMonths } = this.form.controls.loan.controls;

    combineLatest([
      requestedAmount.valueChanges.pipe(startWith(requestedAmount.value)),
      termMonths.valueChanges.pipe(startWith(termMonths.value)),
    ]).pipe(
      debounceTime(250),
      switchMap(([amount, term]) => {
        if (amount < 1000 || term < 6) {
          return of(null);
        }

        const monthlyPayment = calculateMonthlyPayment(amount, term);
        return of({
          monthlyPayment,
          totalRepayment: Math.round(monthlyPayment * term * 100) / 100,
          termMonths: term,
          annualInterestRate: ANNUAL_INTEREST_RATE * 100,
        }).pipe(delay(100));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((simulation) => this.simulation.set(simulation));
  }
}