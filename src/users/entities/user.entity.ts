export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  phone: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}
