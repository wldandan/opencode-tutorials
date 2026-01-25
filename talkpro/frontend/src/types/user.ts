// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  years_of_experience?: number;
  current_company?: string;
  current_role?: string;
  target_role?: string;
  created_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserUpdate {
  name?: string;
  years_of_experience?: number;
  current_company?: string;
  current_role?: string;
  target_role?: string;
}
