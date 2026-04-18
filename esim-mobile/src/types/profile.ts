export interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  role: string;
  balance?: number;
}

export interface UpdateProfileRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
