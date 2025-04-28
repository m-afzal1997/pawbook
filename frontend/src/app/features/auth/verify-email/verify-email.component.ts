import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent {
  private fb = inject(FormBuilder);

  public verifyForm: WritableSignal<FormGroup> = signal(this.fb.group({
    pin: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  }));

  public loading: WritableSignal<boolean> = signal(false);
  public resending: WritableSignal<boolean> = signal(false);
  public email: WritableSignal<string> = signal(localStorage.getItem('pendingVerifyEmail') || '');

  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(SnackbarService);
  private location = inject(Location);

  public onSubmit() {
    if (this.verifyForm().invalid || !this.email()) return;
    this.loading.set(true);
    this.auth.verifyPin(this.email(), this.verifyForm().value.pin).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.snackBar.success(res.message || 'Email verified! You can now log in.');
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.error(err.error?.message || 'Verification failed.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  public goBack() {
    if (window.history.state.navigationId > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  resendPin() {
    if (!this.email()) return;
    this.resending.set(true);
    this.auth.resendPin(this.email()).subscribe({
      next: (res: any) => {
        this.resending.set(false);
        this.snackBar.success(res.message || 'Verification code resent.');
      },
      error: (err: any) => {
        this.resending.set(false);
        this.snackBar.error(err.error?.message || 'Could not resend code.');
      },
      complete: () => {
        this.resending.set(false);
      }
    });
  }
}
