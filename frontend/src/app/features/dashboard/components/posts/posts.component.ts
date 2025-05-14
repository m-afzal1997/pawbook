import { ChangeDetectionStrategy, Component, effect, inject, input, InputSignal, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService } from '../../../../core/services/post.service';
import { Post } from '../../../../core/models/post.model';
import { User } from '../../../../core/models/user.model';
import { BaseComponent } from '../../../../core/classes/base.component';
import { UserService } from '../../../../core/services/user.service';
import { takeUntil } from 'rxjs';
import { TimeAgoPipe } from '../../../../core/pipes/time-ago.pipe';
import { ActionConfirmComponent } from '../../components/action-confirm/action-confirm.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
@Component({
  selector: 'pb-posts',
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    TimeAgoPipe
  ]
})
export class PostsComponent extends BaseComponent implements OnInit {
  public isProfile: InputSignal<boolean> = input(false);
  public searchText: InputSignal<string> = input('');
  public posts: WritableSignal<Post[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(false);

  private currentUser: User | null = null;

  private postService: PostService = inject(PostService);
  private userService: UserService = inject(UserService);
  private snackBar: SnackbarService = inject(SnackbarService);
  private dialog: MatDialog = inject(MatDialog);

  public ngOnInit(): void {
    this.userService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        if(user) {
          this.currentUser = user;
          if(this.isProfile()) {
            this.fetchMyPosts();
          } else {
            this.fetchPosts();
          }
        }
      }
    });
  }

  public onLike(post: Post): void {
    if (!post.is_liked) {
      this.postService.likePost(post.id).subscribe({
        next: (updatedPost) => {
          this.updatePostInSignal(updatedPost);
        }
      });
    } else {
      this.postService.unlikePost(post.id).subscribe({
        next: (updatedPost) => {
          this.updatePostInSignal(updatedPost);
        }
      });
    }
  }

  private updatePostInSignal(updatedPost: Post): void {
    const posts = this.posts();
    const idx = posts.findIndex(p => p.id === updatedPost.id);
    if (idx !== -1) {
      posts[idx] = updatedPost;
      this.posts.set([...posts]);
    }
  }

  public onDelete(post: Post): void {
    const dialogRef = this.dialog.open(ActionConfirmComponent, {
      data: {
        header: 'Delete Post',
        text: 'Are you sure you want to delete this post? This action cannot be undone.'
      },
      width: '350px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.postService.deletePost(post.id).subscribe({
          next: () => {
            this.posts.set(this.posts().filter(p => p.id !== post.id));
            this.snackBar.success('Post deleted');
          }
        });
      }
    });
  }

  public canEditOrDelete(post: Post): boolean {
    return !!this.currentUser && post.user_id == this.currentUser.id;
  }

  public onImgError(img: HTMLImageElement): void {
    img.src = 'assets/icons/default-avatar.svg';
  }

  public trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  public fetchPosts(): void {
    this.loading.set(true);
    this.postService.getPosts(this.searchText()).subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private fetchMyPosts(): void {
    this.loading.set(true);
    this.postService.getMyPosts().subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
