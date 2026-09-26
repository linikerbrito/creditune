import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface CreditScoreInput {
  monthlyIncome: number;
  requestedAmount: number;
  paymentHistoryYears: number;
  existingMonthlyDebt: number;
}

@Injectable({ providedIn: 'root' })
export class CreditScoreService {
  calculate(input: CreditScoreInput): Observable<number> {
    const incomeRatio = input.monthlyIncome > 0
      ? input.existingMonthlyDebt / input.monthlyIncome
      : 1;
    const amountRatio = input.monthlyIncome > 0
      ? input.requestedAmount / (input.monthlyIncome * 12)
      : 1;
    const score = Math.round(Math.max(300, Math.min(
      850,
      600 + input.paymentHistoryYears * 18 - incomeRatio * 180 - amountRatio * 45,
    )));

    return of(score).pipe(delay(300));
  }
}