import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private http = inject(HttpService);

  public likePost(postId: number): Observable<void> {
    return this.http.post<void>(`/posts/${postId}/likes`, {});
  }

  public unlikePost(postId: number): Observable<void> {
    return this.http.delete<void>(`/posts/${postId}/likes`);
  }
} 