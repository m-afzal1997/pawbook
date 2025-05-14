import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseComponent } from '../../../core/classes/base.component';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { takeUntil } from 'rxjs';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { PostsComponent } from '../components/posts/posts.component';
import { Router } from '@angular/router';

@Component({
  selector: 'pb-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NavbarComponent,
    PostsComponent
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent extends BaseComponent implements OnInit {
  public user: WritableSignal<User | null> = signal(null);
  public loading: WritableSignal<boolean> = signal(true);

  private userService = inject(UserService);
  private router = inject(Router);

  public ngOnInit(): void {
    this.subscribeToCurrentUser();
  }

  public onImgError(img: HTMLImageElement): void {
    img.src = 'assets/icons/default-avatar.svg';
  }

  public onEditProfile(): void {
    this.router.navigate(['/dashboard/edit-profile']);
  }

  private subscribeToCurrentUser(): void {
    this.userService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user.set(user);
      this.loading.set(false);
    });
  }

}