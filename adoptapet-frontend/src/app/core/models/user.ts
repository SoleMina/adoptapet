export type Role = 'ADMIN' | 'WORKER' | 'ADOPTER';

/** POST /auth/register (adopter) and POST /users/workers (admin). */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni: string;
  /** yyyy-MM-dd */
  birthDate: string;
  phone: string;
  address?: string;
}

/** PUT /users/me and PUT /users/{id}. Username, role and password are not editable here. */
export type UpdateUserRequest = Omit<RegisterRequest, 'username' | 'password'>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  address: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  /** Token lifetime in milliseconds. */
  expiresIn: number;
  user: UserResponse;
}
