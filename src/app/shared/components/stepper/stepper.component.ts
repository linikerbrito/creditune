import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface StepperStep {
  label: string;
  description?: string;
}

type StepState = 'complete' | 'current' | 'upcoming';

interface RenderedStep extends StepperStep {
  number: number;
  state: StepState;
}

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly steps = input.required<readonly StepperStep[]>();
  readonly activeStep = input.required<number>();
  readonly ariaLabel = input('Etapas');

  readonly renderedSteps = computed<RenderedStep[]>(() => {
    const current = this.activeStep();

    return this.steps().map((step, index) => {
      const number = index + 1;
      const state: StepState = number < current
        ? 'complete'
        : number === current
          ? 'current'
          : 'upcoming';

      return { ...step, number, state };
    });
  });
}