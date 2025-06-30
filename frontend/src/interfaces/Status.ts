import type { VerifyInterface } from "./Verify";
import type { InternshipPostInterface } from "./InternshipPost";

export interface StatusInterface {
  id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  verifies?: VerifyInterface[];
  intership_posts?: InternshipPostInterface[];
}
