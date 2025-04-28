import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { HttpService } from './http.service';
export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  private http = inject(HttpService);

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  public getCurrentUser(): Observable<User> {
    return this.http.get<User>("/users/me").pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  public updateProfile(profileData: FormData): Observable<User> {
    return this.http.uploadFile<User>("/users/me", profileData, 'PUT').pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }
} 