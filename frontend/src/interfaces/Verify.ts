import type { StatusInterface } from "./Status";
import type { UserInterface } from "./User";
import type { AdminInterface } from "./Admin";

export interface VerifyInterface {
  id?: number;
  verification_document: string;
  reason: string;

  status_id: number;
  status?: StatusInterface;

  user_id: number;
  user?: UserInterface;

  admin_id?: number | null;
  admin?: AdminInterface | null;

  CreatedAt?: string;
  DeletedAt?: string | null;
}