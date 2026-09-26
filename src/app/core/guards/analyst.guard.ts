import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const analystGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.isAnalyst()
    ? true
    : inject(Router).createUrlTree(['/client/proposals']);
};