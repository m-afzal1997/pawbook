import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';
export const errorInterceptor: HttpInterceptorFn = (request, next) => {

  const authService = inject(AuthService);
  const snackBar = inject(SnackbarService);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = error.error?.message || error.message || 'An error occurred';

        if (error.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          authService.logout();
        }

        snackBar.error(errorMessage);

      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        statusText: error.statusText
      }));
    })
  );
}; 