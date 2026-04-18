export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'CLIENT' | 'SALESMAN' | 'CUSTOMER';
  status: 'ONLINE' | 'OFFLINE';
  balance?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}
