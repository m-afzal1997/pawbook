export interface Post {
  id: number;
  user_id: number;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
  author_profile_picture?: string;
  author_name?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export interface PostResponse {
  posts: Post[];
}

export interface CreatePostRequest {
  content: string;
  image?: File;
}

export interface UpdatePostRequest {
  content?: string;
  image?: File;
} 