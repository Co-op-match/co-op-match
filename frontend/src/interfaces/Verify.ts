import type { StatusVerifyInterface } from "./StatusVerify";
import type { UserInterface } from "./User";
import type { AdminInterface } from "./Admin";

export interface VerifyInterface {
  ID?: number;
  verification_document?: string;
  reason?: string;
  verified_at?: string;

  StatusVerifyID?: number;
  StatusVerify?: StatusVerifyInterface;

  UserID?: number;
  User?: UserInterface;

  AdminID?: number | null;
  Admin?: AdminInterface | null;

  CreatedAt?: string;
  DeletedAt?: string | null;
  UpdatedAt?: string;
}