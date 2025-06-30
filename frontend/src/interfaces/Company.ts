import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { ContactInterface } from "./Contact";
import type { InternshipPostInterface } from "./InternshipPost";
import type { InterviewAppointmentInterface } from "./InterviewAppointment";
import type { ReviewInterface } from "./Review";
import type { UserInterface } from "./User";

export interface CompanyInterface {
  ID?: number;
  company_name?: string;
  logo?: string;

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

  CreatedAt?: string;
  DeletedAt?: string | null;

  // เพิ่ม fields สำหรับ UI:
  status?: string;
  verify?: boolean;
}
