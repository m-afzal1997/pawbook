export interface User {
  id: number;
  email: string;
  name: string;
  bio?: string;
  profile_picture?: string | File;
  created_at: string;
  updated_at: string;
  post_count?: number;
}


export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  bio?: string;
  profile_picture?: File;
} 