import type { UserInterface } from "./User";

export interface AdminInterface {
  id: number;
  first_name: string;
  last_name: string;

  ID?: number;
  birthday?: string;

  User?: UserInterface;
}
