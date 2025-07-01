import type { StatusVerifyInterface } from "./StatusVerify";
import type { UserInterface } from "./User";
import type { AdminInterface } from "./Admin";

export interface VerifyInterface {
  ID?: number;
  verification_document: string;
  reason: string;

  status_verify_id: number;
  status_verify?: StatusVerifyInterface;

  user_id: number;
  User?: UserInterface;

  admin_id?: number | null;
  admin?: AdminInterface | null;

  CreatedAt?: string;
  DeletedAt?: string | null;
}