export interface AdminInterface {
  id: number;
  ID: number;
  first_name: string;
  last_name: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birthday: string; // ISO string: '2025-09-08' หรือ '2025-09-08T00:00:00Z'
  is_active?: boolean;
  role: string;
}
