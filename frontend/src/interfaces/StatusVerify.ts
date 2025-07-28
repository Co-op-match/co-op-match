import type { VerifyInterface } from "./Verify";

export interface StatusVerifyInterface {
  ID?: number;
  status_verify: string;

  CreatedAt?: string;
  DeletedAt?: string | null;

  verifies?: VerifyInterface[];
}