import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { unauthGuard } from '../../core/guards/unauth.guard';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [unauthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [unauthGuard]
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    canActivate: [unauthGuard]
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [unauthGuard]
  }
]; 