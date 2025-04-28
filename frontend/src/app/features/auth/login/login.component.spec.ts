import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthResponse } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Location } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let location: Location;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          { path: 'home', component: LoginComponent },
          { path: 'auth/register', component: LoginComponent },
          { path: 'auth/reset-password', component: LoginComponent },
          { path: 'auth/verify-email', component: LoginComponent }
        ]),
        MatSnackBarModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty form', () => {
    const form = component.loginForm();
    expect(form.get('email')?.value).toBe('');
    expect(form.get('password')?.value).toBe('');
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm().get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
    expect(emailControl?.errors?.['email']).toBeFalsy();
  });

  it('should validate password length', () => {
    const passwordControl = component.loginForm().get('password');
    passwordControl?.setValue('12345');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();

    passwordControl?.setValue('123456');
    expect(passwordControl?.valid).toBeTruthy();
    expect(passwordControl?.errors?.['minlength']).toBeFalsy();
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should render login form with all required elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('should navigate to register page when clicking sign up link', fakeAsync(() => {
    const compiled = fixture.nativeElement as HTMLElement;
    const registerLink = compiled.querySelector('a[routerLink="/auth/register"]') as HTMLElement;
    registerLink.click();
    tick();
    expect(location.path()).toBe('/auth/register');
  }));

  it('should navigate to reset password page when clicking reset password link', fakeAsync(() => {
    const compiled = fixture.nativeElement as HTMLElement;
    const resetPasswordLink = compiled.querySelector('a[routerLink="/auth/reset-password"]') as HTMLElement;
    resetPasswordLink.click();
    tick();
    expect(location.path()).toBe('/auth/reset-password');
  }));

  it('should handle successful login', fakeAsync(() => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const mockResponse: AuthResponse = { token: 'fake-token', user: mockUser };
    authService.login.and.returnValue(of(mockResponse));

    component.loginForm().setValue({
      email: 'test@example.com',
      password: '123456'
    });

    component.onSubmit();
    tick();

    expect(authService.login).toHaveBeenCalledWith('test@example.com', '123456');
    expect(snackbarService.success).toHaveBeenCalledWith('Login successful');
    expect(location.path()).toBe('/home');
  }));

  it('should handle login error', fakeAsync(() => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authService.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm().setValue({
      email: 'test@example.com',
      password: 'wrong-password'
    });

    component.onSubmit();
    tick();

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrong-password');
    expect(snackbarService.error).toHaveBeenCalledWith('Invalid credentials');
    expect(component.loading()).toBeFalse();
  }));

  it('should handle email verification required error', fakeAsync(() => {
    const errorResponse = { 
      error: { 
        needsVerification: true,
        message: 'Please verify your email' 
      } 
    };
    authService.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm().setValue({
      email: 'unverified@example.com',
      password: '123456'
    });

    component.onSubmit();
    tick();

    expect(authService.login).toHaveBeenCalledWith('unverified@example.com', '123456');
    expect(snackbarService.error).toHaveBeenCalledWith('Please verify your email');
    expect(location.path()).toBe('/auth/verify-email');
    expect(localStorage.getItem('pendingVerifyEmail')).toBe('unverified@example.com');
    expect(component.loading()).toBeFalse();
  }));
});
