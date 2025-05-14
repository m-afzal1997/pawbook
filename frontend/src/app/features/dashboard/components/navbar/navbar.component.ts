import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ActionConfirmComponent } from '../action-confirm/action-confirm.component';

@Component({
  selector: 'pb-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatInputModule
  ],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  public currentUser: User | null = null;
  private authService: AuthService = inject(AuthService);
  private userService: UserService = inject(UserService);
  private dialog = inject(MatDialog);

  public ngOnInit(): void {
    this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  public logout(): void {
    const dialogRef = this.dialog.open(ActionConfirmComponent, {
      data: {
        header: 'Logout',
        text: 'Are you sure you want to log out?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout();
      }
    });
  }

  public onImgError(img: HTMLImageElement): void {
    img.src = 'assets/icons/default-avatar.svg';
  }
}
