import type { InternshipPostInterface } from "./InternshipPost";
import type { ApplicationDetailInterface } from "./ApplicationDetail";

export interface ApplicationInterface {
  id?: number;
  status?: string;
  resume_url?: string;
  submit_at?: string;

  intership_post_id?: number;
  intership_post?: InternshipPostInterface;

  application_details?: ApplicationDetailInterface[];
}
