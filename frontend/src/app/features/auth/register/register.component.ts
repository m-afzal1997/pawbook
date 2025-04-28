import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'pb-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);

  public registerForm: WritableSignal<FormGroup> = signal(this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(3)]],
    lastName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    bio: ['']
  }, {
    validators: this.passwordMatchValidator
  }));

  public isLoading: WritableSignal<boolean> = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(SnackbarService);

  public onSubmit(): void {
    if (this.registerForm().valid) {
      this.isLoading.set(true);

      const { firstName, lastName, email, password, bio } = this.registerForm().value;

      this.authService.register({ name: `${firstName} ${lastName}`, email, password, bio }).subscribe({
        next: () => {
          this.isLoading.set(false);
          localStorage.setItem('pendingVerifyEmail', email);
          this.router.navigate(['/auth/verify-email']);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.snackBar.error(err.error?.message || 'An error occurred during registration');
        }
      });
    }
  }

  private passwordMatchValidator(formGroup: FormGroup): { passwordMismatch: boolean } | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
}
