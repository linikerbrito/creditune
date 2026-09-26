import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userState = signal<User | null>(null);
  private readonly tokenState = signal<string | null>(null);

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly isAnalyst = computed(() => this.userState()?.role === 'analyst');

  getToken(): string | null {
    return this.tokenState();
  }

  loginAs(role: UserRole): Observable<User> {
    const user: User = role === 'analyst'
      ? { id: 'analyst-1', name: 'Alex Analista', email: 'analista@creditune.dev', role }
      : { id: 'client-1', name: 'Camila Cliente', email: 'cliente@creditune.dev', role };

    return of(user).pipe(
      delay(150),
      tap((authenticatedUser) => {
        this.userState.set(authenticatedUser);
        this.tokenState.set(`creditune-demo-${authenticatedUser.id}`);
      }),
    );
  }

  logout(): void {
    this.userState.set(null);
    this.tokenState.set(null);
  }
}