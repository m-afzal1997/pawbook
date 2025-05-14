import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';
import { NavbarComponent } from './navbar.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockUser: User = { id: 1, email: 'test@example.com', name: 'Test User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  class MockDialog {
    constructor(private result: any) { }
    open() { return { afterClosed: () => of(this.result) }; }
  }

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser'], { currentUser$: of(mockUser) });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule, MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    userService.getCurrentUser.and.returnValue(of(mockUser));
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should render the navbar (desktop)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.paw-book-logo')?.textContent).toContain('PawBook');
    expect(compiled.querySelector('a[routerLink="/dashboard/home"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/dashboard/create-post"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/dashboard/search"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/dashboard/profile"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/dashboard/profile"] img')).toBeTruthy();
    expect(compiled.querySelector('a[routerLink="/dashboard/profile"] span')?.textContent).toContain('My Profile');
    expect(compiled.querySelector('a[routerLink="/dashboard/profile"] + a span')?.textContent).toContain('Logout');
  });

  it('should render the navbar (mobile)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header .paw-book-logo')?.textContent).toContain('PawBook');
    expect(compiled.querySelector('footer button[routerLink="/dashboard/home"]')).toBeTruthy();
    expect(compiled.querySelector('footer button[routerLink="/dashboard/create-post"]')).toBeTruthy();
    expect(compiled.querySelector('footer button[routerLink="/dashboard/profile"]')).toBeTruthy();
    const footerButtons = compiled.querySelectorAll('footer button mat-icon');
    expect(Array.from(footerButtons).some(icon => icon.textContent?.includes('search'))).toBeTruthy();
    expect(Array.from(footerButtons).some(icon => icon.textContent?.includes('logout'))).toBeTruthy();
  });

  it('should log out (logout)', fakeAsync(() => {
    const mockDialog = new MockDialog(true) as any;
    (component as any).dialog = mockDialog;
    component.logout();
    tick();
    flushMicrotasks();
    expect(authService.logout).toHaveBeenCalled();
  }));

  it('should not log out (cancel)', fakeAsync(() => {
    const mockDialog = new MockDialog(false) as any;
    (component as any).dialog = mockDialog;
    component.logout();
    tick();
    flushMicrotasks();
    expect(authService.logout).not.toHaveBeenCalled();
  }));

  it('should handle image error (onImgError)', () => {
    const img = document.createElement('img');
    component.onImgError(img);
    expect(img.src).toContain('assets/icons/default-avatar.svg');
  });
});
