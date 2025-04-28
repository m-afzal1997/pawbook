import { Component, inject, WritableSignal, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  public loginForm: WritableSignal<FormGroup> = signal(this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  }));

  public loading: WritableSignal<boolean> = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(SnackbarService);

  public onSubmit(): void {
    if (this.loginForm().invalid) return;
    this.loading.set(true);

    const { email, password } = this.loginForm().value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.success('Login successful');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.error?.needsVerification) {
          localStorage.setItem('pendingVerifyEmail', email);
          this.snackBar.error(err.error?.message || 'Please verify your email to continue');
          this.router.navigate(['/auth/verify-email']);
        } else {
          this.snackBar.error(err.error?.message || 'Invalid email or password');
        }
      }
    });
  }
}
