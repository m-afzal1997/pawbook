import { Component, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { PostsComponent } from '../components/posts/posts.component';
import { debounceTime, takeUntil } from 'rxjs';
import { BaseComponent } from '../../../core/classes/base.component';
@Component({
  selector: 'pb-search',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatInputModule, MatButtonModule, FormsModule, NavbarComponent, PostsComponent, ReactiveFormsModule],
  templateUrl: './search.component.html'
})

export class SearchComponent extends BaseComponent implements OnInit {
  public searchText: WritableSignal<string> = signal('');
  public searchControl = new FormControl('');
  @ViewChild(PostsComponent) postsComponent!: PostsComponent;

  ngOnInit(): void {
    this.subscribeToSearch();
  }

  public clearSearch(): void {
    this.searchText.set('');
  }

  public subscribeToSearch(): void {
    this.searchControl.valueChanges.pipe(debounceTime(700), takeUntil(this.destroy$)).subscribe(() => {
      this.postsComponent.fetchPosts();
    });
  }
}
