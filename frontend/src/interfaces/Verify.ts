import type { StatusInterface } from "./Status";
import type { UserInterface } from "./User";
import type { AdminInterface } from "./Admin";

export interface VerifyInterface {
  ID?: number;
  verification_document: string;
  reason: string;

  status_id: number;
  status?: StatusInterface;

  user_id: number;
  User?: UserInterface;

  admin_id?: number | null;
  admin?: AdminInterface | null;

  CreatedAt?: string;
  DeletedAt?: string | null;
}