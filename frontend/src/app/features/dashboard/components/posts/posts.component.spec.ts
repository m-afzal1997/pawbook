import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PostsComponent } from './posts.component';
import { PostService } from '../../../../core/services/post.service';
import { UserService } from '../../../../core/services/user.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { Post } from '../../../../core/models/post.model';
import { User } from '../../../../core/models/user.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';

describe('PostsComponent', () => {
  let component: PostsComponent;
  let fixture: ComponentFixture<PostsComponent>;
  let postService: jasmine.SpyObj<PostService>;
  let userService: jasmine.SpyObj<UserService>;
  let snackBar: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockPosts: Post[] = [
    {
      id: 1,
      content: 'Test post 1',
      image: 'test-image-1.jpg',
      user_id: 1,
      author_name: 'Test User',
      author_profile_picture: 'test-avatar.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      is_liked: false
    },
    {
      id: 2,
      content: 'Test post 2',
      image: 'test-image-2.jpg',
      user_id: 2,
      author_name: 'Other User',
      author_profile_picture: 'other-avatar.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 1,
      is_liked: true
    }
  ];

  beforeEach(async () => {
    const postServiceSpy = jasmine.createSpyObj('PostService', [
      'getPosts',
      'getMyPosts',
      'likePost',
      'unlikePost',
      'deletePost'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', [], {
      currentUser$: of(mockUser)
    });
    const snackBarSpy = jasmine.createSpyObj('SnackbarService', ['success', 'error']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        PostsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        RouterTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: PostService, useValue: postServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: SnackbarService, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    postService = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    snackBar = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load posts on initialization', fakeAsync(() => {
      postService.getPosts.and.returnValue(of({ posts: mockPosts }));
      fixture.detectChanges();
      tick();
      expect(postService.getPosts).toHaveBeenCalledWith('');
      expect(component.posts()).toEqual(mockPosts);
    }));

    it('should load user posts when isProfile is true', fakeAsync(() => {
      const profileFixture = TestBed.createComponent(PostsComponent);
      const profileComponent = profileFixture.componentInstance;
      postService.getMyPosts.and.returnValue(of({ posts: mockPosts }));
      // Set the input signal using Angular's setInput
      profileFixture.componentRef.setInput('isProfile', true);
      profileFixture.detectChanges();
      tick();
      expect(postService.getMyPosts).toHaveBeenCalled();
      expect(profileComponent.posts()).toEqual(mockPosts);
    }));
  });

  describe('Post Interactions', () => {
    beforeEach(() => {
      postService.getPosts.and.returnValue(of({ posts: mockPosts }));
      fixture.detectChanges();
    });

    it('should like a post', fakeAsync(() => {
      const updatedPost = { ...mockPosts[0], is_liked: true, likes_count: 1 };
      postService.likePost.and.returnValue(of(updatedPost));

      component.onLike(mockPosts[0]);
      tick();

      expect(postService.likePost).toHaveBeenCalledWith(mockPosts[0].id);
      expect(component.posts()[0].is_liked).toBeTrue();
      expect(component.posts()[0].likes_count).toBe(1);
    }));

    it('should unlike a post', fakeAsync(() => {
      const updatedPost = { ...mockPosts[1], is_liked: false, likes_count: 0 };
      postService.unlikePost.and.returnValue(of(updatedPost));

      component.onLike(mockPosts[1]);
      tick();

      expect(postService.unlikePost).toHaveBeenCalledWith(mockPosts[1].id);
      expect(component.posts()[1].is_liked).toBeFalse();
      expect(component.posts()[1].likes_count).toBe(0);
    }));

    it('should delete a post when confirmed', fakeAsync(() => {
      // Use custom synchronous dialog mock
      const mockDialog = new MockDialog(true) as any;
      (component as any).dialog = mockDialog;
      postService.deletePost.and.returnValue(of(void 0));
      component.posts.set([...mockPosts]);
      fixture.detectChanges();
      component.onDelete(mockPosts[0]);
      tick();
      expect(component.posts().length).toBe(1);
      expect(postService.deletePost).toHaveBeenCalledWith(mockPosts[0].id);
      expect(snackBar.success).toHaveBeenCalledWith('Post deleted');
    }));

    it('should not delete a post when not confirmed', fakeAsync(() => {
      // Use custom synchronous dialog mock
      const mockDialog = new MockDialog(false) as any;
      (component as any).dialog = mockDialog;
      component.posts.set([...mockPosts]);
      fixture.detectChanges();
      component.onDelete(mockPosts[0]);
      tick();
      expect(postService.deletePost).not.toHaveBeenCalled();
      expect(component.posts().length).toBe(2);
    }));
  });

  describe('Permission Checks', () => {
    beforeEach(() => {
      // Ensure the component has the current user set
      fixture.detectChanges();
    });

    it('should allow edit/delete for user\'s own posts', () => {
      const ownPost = { ...mockPosts[0], user_id: mockUser.id };
      expect(component.canEditOrDelete(ownPost)).toBeTrue();
    });

    it('should not allow edit/delete for other users\' posts', () => {
      const otherPost = { ...mockPosts[1], user_id: 999 };
      expect(component.canEditOrDelete(otherPost)).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    it('should handle image loading errors', () => {
      const imgElement = document.createElement('img');
      component.onImgError(imgElement);
      expect(imgElement.src).toContain('assets/icons/default-avatar.svg');
    });

    it('should handle post loading errors', fakeAsync(() => {
      postService.getPosts.and.returnValue(throwError(() => new Error('Failed to load posts')));
      fixture.detectChanges();
      tick();
      expect(component.loading()).toBeFalse();
      expect(component.posts().length).toBe(0);
    }));
  });

  describe('UI States', () => {
    it('should show loading state while fetching posts', fakeAsync(() => {
      // Create a delayed response to test loading state
      postService.getPosts.and.returnValue(
        timer(100).pipe(
          map(() => ({ posts: [] }))
        )
      );

      fixture.detectChanges();
      expect(component.loading()).toBeTrue();

      tick(100);
      fixture.detectChanges();
      expect(component.loading()).toBeFalse();
    }));

    it('should show empty state when no posts are available', fakeAsync(() => {
      postService.getPosts.and.returnValue(of({ posts: [] }));
      fixture.detectChanges();
      tick();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-icon')?.textContent).toContain('photo_camera');
      expect(compiled.querySelector('h3')?.textContent).toContain('No Posts Yet');
    }));

    it('should display posts when available', fakeAsync(() => {
      postService.getPosts.and.returnValue(of({ posts: mockPosts }));
      fixture.detectChanges();
      tick();

      const compiled = fixture.nativeElement as HTMLElement;
      const postElements = compiled.querySelectorAll('article');
      expect(postElements.length).toBe(2);
    }));
  });
});

class MockDialog {
  constructor(private result: any) { }
  open() {
    return {
      afterClosed: () => of(this.result)
    };
  }
}
