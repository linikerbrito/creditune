export type UserRole = 'client' | 'analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}