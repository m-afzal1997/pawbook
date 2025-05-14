import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../../core/services/snackbar.service';
@Component({
  selector: 'pb-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  public step: WritableSignal<'request' | 'verify' | 'reset' | 'done'> = signal('request');
  public email: WritableSignal<string> = signal('');

  private fb = inject(FormBuilder);

  requestForm: WritableSignal<FormGroup> = signal(this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  }));
  verifyForm: WritableSignal<FormGroup> = signal(this.fb.group({
    pin: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  }));
  resetForm: WritableSignal<FormGroup> = signal(this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator }));
  public loading: WritableSignal<boolean> = signal(false);
  public error: WritableSignal<string | null> = signal(null);
  private auth = inject(AuthService);
  private snackBar = inject(SnackbarService);
  private router = inject(Router);

  public onRequest() {
    if (this.requestForm().invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.email.set(this.requestForm().value.email);
    this.auth.requestReset(this.email()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.snackBar.success(res.message || 'Reset code sent to your email.');
        this.step.set('verify');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.error(err.error?.message || 'Could not send reset code.');
      }
    });
  }

  public goBack() {
    if (this.step() != 'request') {
      this.step.set('request');
      return;
    }
    if (window.history.state.navigationId > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  public onVerify() {
    if (this.verifyForm().invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyResetPin(this.email(), this.verifyForm().value.pin).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.snackBar.success(res.message || 'Code verified. Set your new password.');
        this.step.set('reset');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.error(err.error?.message || 'Invalid or expired code.');
      }
    });
  }

  public onReset() {
    if (this.resetForm().invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { password } = this.resetForm().value;
    const pin = this.verifyForm().value.pin;
    this.auth.resetPassword(this.email(), pin, password).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.snackBar.success(res.message || 'Password reset successful!');
        this.step.set('done');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.error(err.error?.message || 'Could not reset password.');
      }
    });
  }

  public resendPin() {
    if (!this.email()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.resendPin(this.email()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.snackBar.success(res.message || 'Reset code resent.');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.error(err.error?.message || 'Could not resend code.');
      }
    });
  }

  public getErrorMessage(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);
    if (!control) return '';
    if (control.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (controlName === 'email' && control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (controlName === 'password' && control.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    if (controlName === 'confirmPassword' && form.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    if (controlName === 'pin' && control.hasError('pattern')) {
      return 'PIN must be 6 digits';
    }
    return '';
  }

  private passwordMatchValidator(formGroup: FormGroup): { passwordMismatch: boolean } | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
}
