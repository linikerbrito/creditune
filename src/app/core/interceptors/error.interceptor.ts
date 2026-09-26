import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) => next(request).pipe(
  catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => error);
    }

    const message = error.status === 0
      ? 'Não foi possível conectar ao serviço.'
      : error.error?.message ?? 'Ocorreu um erro ao processar a solicitação.';
    const normalizedError = typeof error.error === 'object' && error.error !== null
      ? { ...error.error, message }
      : { message, details: error.error };

    return throwError(() => new HttpErrorResponse({
      error: normalizedError,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined,
    }));
  }),
);