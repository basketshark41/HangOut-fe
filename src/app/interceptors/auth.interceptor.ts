import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  // Add auth token to requests (except auth endpoints)
  if (!isAuthEndpoint(request.url)) {
    const token = authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.log('Token expired or invalid, logging out...');
        authService.logout();
        return throwError(() => error);
      }

      // Handle other errors
      return throwError(() => error);
    })
  );
};

function isAuthEndpoint(url: string): boolean {
  const authEndpoints = [
    '/api/Auth/login',
    '/api/Auth/register',
    '/api/Auth/checkUsername',
    '/api/Auth/checkEmail'
  ];
  
  return authEndpoints.some(endpoint => url.includes(endpoint));
} 