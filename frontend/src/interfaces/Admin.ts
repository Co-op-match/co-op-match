import type { UsersInterface } from "./auth/IUser";

export interface AdminInterface {
  ID: number;
  first_name: string;
  last_name: string;
  birthday: Date;
  user_id: number;
  User?: UsersInterface;
}
