import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PostService } from '../../../../core/services/post.service';
import { Post } from '../../../../core/models/post.model';
import { MatIconModule } from '@angular/material/icon';
import { NavbarComponent } from '../navbar/navbar.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
@Component({
  selector: 'pb-create-edit-post',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterModule,
    NavbarComponent
  ],
  templateUrl: './create-edit-post.component.html'
})
export class CreateEditPostComponent implements OnInit {
  private fb = inject(FormBuilder);
  public form: WritableSignal<FormGroup> = signal(this.fb.group({
    caption: ['', [Validators.required, Validators.maxLength(2200)]],
    image: [null]
  }));
  public loading: WritableSignal<boolean> = signal(false);
  public isEdit: WritableSignal<boolean> = signal(false);
  public postId: WritableSignal<string | null> = signal(null);
  public imagePreview: WritableSignal<string | ArrayBuffer | null> = signal(null);

  private postService = inject(PostService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(SnackbarService);


  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.postId.set(params.get('id'));
      this.isEdit.set(!!this.postId());
      if (this.isEdit() && this.postId()) {
        this.loading.set(true);
        this.postService.getPostById(Number(this.postId())).subscribe({
          next: (post: Post) => {
            this.form().patchValue({
              caption: post.content,
              image: null
            });
            this.imagePreview.set(post.image ?? null);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      }
    });
  }
  public onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/icons/default-avatar.svg';
  }

  public onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      input.value = '';
      this.form().patchValue({ image: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  public onSubmit(): void {
    if (this.form().invalid) return;
    this.loading.set(true);
    const { caption, image } = this.form().value;
    if (this.isEdit() && this.postId()) {
      const updateReq = { content: caption, image };
      this.postService.updatePost(Number(this.postId()), updateReq).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.success('Post updated!');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    } else {
      const createReq = { content: caption, image };
      this.postService.createPost(createReq).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.success('Post created!');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
