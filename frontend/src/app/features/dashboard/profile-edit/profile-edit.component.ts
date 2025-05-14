import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { takeUntil } from 'rxjs';
import { BaseComponent } from '../../../core/classes/base.component';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../core/services/snackbar.service';
@Component({
  selector: 'pb-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    NavbarComponent
  ],
  templateUrl: './profile-edit.component.html'
})
export class ProfileEditComponent extends BaseComponent implements OnInit {
  private fb = inject(FormBuilder);
  public profileForm: WritableSignal<FormGroup> = signal(this.fb.group({
    name: ['', Validators.required],
    bio: ['']
  }));
  public profilePicturePreview: WritableSignal<string | null> = signal(null);
  public selectedFile: WritableSignal<File | null> = signal(null);
  public userEmail: string = '';
  private userService = inject(UserService);
  private snackBar = inject(SnackbarService);
  private router = inject(Router);


  public ngOnInit(): void {
    this.subscribeToCurrentUser();
  }

  public onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicturePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  public onSubmit(): void {
    if (this.profileForm().valid) {
      const formData = new FormData();
      formData.append('name', this.profileForm().get('name')?.value);
      formData.append('bio', this.profileForm().get('bio')?.value);
      const file = this.selectedFile();
      if (file) {
        formData.append('profile_picture', file);
      }
      this.userService.updateProfile(formData).subscribe({
        next: (user: User) => {
          this.userService.setCurrentUser(user);
          this.snackBar.success('Profile updated successfully');
          this.router.navigate(['/dashboard/profile']);
        }
      });
    }
  }

  public onImgError(img: HTMLImageElement): void {
    img.src = 'assets/icons/default-avatar.svg';
  }

  private subscribeToCurrentUser(): void {
    this.userService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.profileForm().patchValue({
          name: user.name,
          bio: user.bio
        });
        this.profilePicturePreview.set(user.profile_picture as string);
        this.userEmail = user.email;
      }
    });
  }

}
