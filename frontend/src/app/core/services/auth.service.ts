import { inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { RegisterRequest, User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { SnackbarService } from './snackbar.service';

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  private httpHandler: HttpBackend = inject(HttpBackend);
  private httpClient: HttpClient =  new HttpClient(this.httpHandler);
  private router: Router = inject(Router);
  private snackbar: SnackbarService = inject(SnackbarService);
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public login(email: string, password: string): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  public register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${environment.apiUrl}/auth/register`, registerRequest);
  }

  public logout(): void {
    this.revokeToken();
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public verifyPin(email: string, pin: string): Observable<any> {
    return this.httpClient.post<any>(`${environment.apiUrl}/auth/verify-pin`, { email, pin });
  }

  public resendPin(email: string): Observable<any> {
    return this.httpClient.post<any>(`${environment.apiUrl}/auth/resend-pin`, { email });
  }

  public requestReset(email: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/auth/request-reset`, { email });
  }

  public verifyResetPin(email: string, pin: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/auth/verify-reset-pin`, { email, pin });
  }

  public resetPassword(email: string, pin: string, newPassword: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/auth/reset-password`, { email, pin, newPassword });
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private revokeToken(): void {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.httpClient.post(`${environment.apiUrl}/auth/logout`, {}, { headers }).subscribe((response) => {
      this.snackbar.success( 'Logged out successfully');
      this.removeToken();

      this.currentUserSubject.next(null);
      this.router.navigate(['/auth/login']);
    }, (error) => {
      this.snackbar.error(error.error.message);
    });
  }


  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
} 