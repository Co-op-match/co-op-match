import type { VerifyInterface } from "./Verify";
import type { InternshipPostInterface } from "./InternshipPost";

export interface StatusInterface {
  id?: number;
  status: string;

  CreatedAt?: string;
  DeletedAt?: string | null;

  verifies?: VerifyInterface[];
  intership_posts?: InternshipPostInterface[];
}
