import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-currency-input',
  templateUrl: './currency-input.component.html',
  styleUrl: './currency-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CurrencyInputComponent),
    multi: true,
  }],
})
export class CurrencyInputComponent implements ControlValueAccessor {
  readonly inputId = input('');
  readonly placeholder = input('0,00');
  readonly ariaLabel = input<string | undefined>();
  readonly ariaDescribedBy = input<string | undefined>();

  readonly formattedValue = signal('');
  readonly disabled = signal(false);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.formattedValue.set(
      typeof value === 'number' && Number.isFinite(value)
        ? this.formatAmount(value)
        : '',
    );
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const digits = inputElement.value.replace(/\D/g, '');

    if (digits.length === 0) {
      this.formattedValue.set('');
      this.onChange(null);
      return;
    }

    const amount = Number(digits) / 100;
    if (!Number.isFinite(amount)) {
      return;
    }

    this.formattedValue.set(this.formatAmount(amount));
    this.onChange(amount);
  }

  markTouched(): void {
    this.onTouched();
  }

  private formatAmount(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}