import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { ContactInterface } from "./Contact";
import type { InternshipPostInterface } from "./InternshipPost";
import type { InterviewAppointmentInterface } from "./InterviewAppointment";
import type { ReviewInterface } from "./Review";
import type { UserInterface } from "./User";

export interface CompanyInterface {
  id?: number;
  company_name?: string;
  logo?: string;
  verify?: boolean;

  user_id?: number;
  user?: UserInterface;

  address_id?: number;
  address?: AddressInterface;

  admin_id?: number;
  admin?: AdminInterface;

  contact?: ContactInterface[];
  intership_posts?: InternshipPostInterface[];
  interview_appointments?: InterviewAppointmentInterface[];
  reviews?: ReviewInterface[];

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
