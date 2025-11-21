export interface UserListDto {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
}

export interface UserDetailsDto {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  isActive: boolean;
  profileImagePath?: string | null;
  isEmailConfirmed: boolean;
}

export interface CreateUserDto {
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  roleId: string;
  isActive: boolean;
  password: string;
  emailConfirmed?: boolean; // optional: see backend suggestion
}

export interface UpdateUserDto {
  firstName: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  roleId: string;
  isActive: boolean;
  emailConfirmed?: boolean; // optional
  resetPassword?: string | null; // optional - if provided, backend to reset
}
