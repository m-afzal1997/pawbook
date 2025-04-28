import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Post, PostResponse, CreatePostRequest, UpdatePostRequest } from '../models/post.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpService);

  public getPosts(search: string = ''): Observable<PostResponse> {
    return this.http.get<PostResponse>('/posts', { search });
  }

  public getMyPosts(): Observable<PostResponse> {
    return this.http.get<PostResponse>(`/posts/me`);
  }

  public createPost(postData: CreatePostRequest): Observable<Post> {
    const formData = new FormData();
    formData.append('content', postData.content);
    if (postData.image) {
      formData.append('image', postData.image);
    }
    return this.http.uploadFile<Post>('/posts', formData);
  }

  public updatePost(id: number, postData: UpdatePostRequest): Observable<Post> {
    const formData = new FormData();
    if (postData.content) {
      formData.append('content', postData.content);
    }
    if (postData.image) {
      formData.append('image', postData.image);
    }
    return this.http.uploadFile<Post>(`/posts/${id}`, formData, 'PUT');
  }

  public deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`/posts/${id}`);
  }

  public likePost(id: number): Observable<Post> {
    return this.http.post<{ success: boolean; post: Post }>(`/posts/${id}/like`, {}).pipe(
      map(res => res.post)
    );
  }

  public unlikePost(id: number): Observable<Post> {
    return this.http.delete<{ success: boolean; post: Post }>(`/posts/${id}/like`).pipe(
      map(res => res.post)
    );
  }

  public searchPosts(query: string, page: number = 1, limit: number = 10): Observable<PostResponse> {
    return this.http.get<PostResponse>('/posts/search', { query, page, limit });
  }

  public getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`/posts/${id}`);
  }
} 