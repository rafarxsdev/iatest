export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
}

export interface UserSecurityStatus {
  failedLoginAttempts: number;
  loginBlockedUntil: string | null;
  passwordChangedAt: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isDeleted: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  securityStatus: UserSecurityStatus;
}

export interface UserFormData {
  email: string;
  fullName: string;
  roleId: string;
  password?: string;
  isActive: boolean;
}

export interface ProfileFormData {
  fullName: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/** Respuesta de GET /api/auth/me y PATCH /api/auth/profile (rol como objeto). */
export interface AuthMeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  lastLoginAt: string | null;
  createdAt: string;
}
