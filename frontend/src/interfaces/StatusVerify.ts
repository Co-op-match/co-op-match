import type { VerifyInterface } from "./Verify";

export interface StatusVerifyInterface {
  id?: number;
  status_verify: string;

  CreatedAt?: string;
  DeletedAt?: string | null;

  verifies?: VerifyInterface[];
}
