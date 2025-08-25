import type { UserInterface } from "./User";

export interface LoginLogInterface {
  ID?: number;
  ip?: string;
  device?: string;
  login_at?: string;
  logout_at?: string | null;
  user_id?: number;
  User?: UserInterface;
}