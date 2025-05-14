import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { PostsComponent } from '../components/posts/posts.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        NavbarComponent,
        PostsComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the home component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    it('should render the navbar component in the correct position', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const navbar = compiled.querySelector('pb-navbar');
      expect(navbar).toBeTruthy();
      // Navbar should be at the top level
      expect(navbar?.parentElement?.classList.contains('py-20')).toBeFalsy();
    });

    it('should render the posts component within the main container', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.py-20');
      const posts = container?.querySelector('pb-posts');

      expect(container).toBeTruthy();
      expect(posts).toBeTruthy();
      expect(posts?.parentElement?.classList.contains('py-20')).toBeTruthy();
    });
  });

  describe('Layout Structure', () => {
    it('should have the correct layout structure with proper spacing', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.py-20');

      expect(container).toBeTruthy();
      // Verify the container has the correct padding classes
      expect(container?.classList.contains('py-20')).toBeTruthy();
      // Verify the posts component is inside the container
      expect(container?.querySelector('pb-posts')).toBeTruthy();
    });

    it('should maintain proper component hierarchy', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const navbar = compiled.querySelector('pb-navbar');
      const container = compiled.querySelector('.py-20');
      const posts = container?.querySelector('pb-posts');

      // Verify the component hierarchy
      expect(navbar?.nextElementSibling).toBe(container);
      expect(container?.firstElementChild).toBe(posts);
    });
  });
});
