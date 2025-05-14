import { Component } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { PostsComponent } from '../components/posts/posts.component';
@Component({
  selector: 'pb-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [
    NavbarComponent,
    PostsComponent
  ]
})
export class HomeComponent {

}
