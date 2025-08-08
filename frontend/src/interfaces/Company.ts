import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { UserInterface } from "./User";
import type { ContactInterface } from "./Contact";
import type { IntershipPostInterface } from "./IntershipPost";
import type { InterviewAppointmentInterface } from "./InterviewAppointment";
import type { ReviewInterface } from "./Review";
import type { VerifyInterface } from "./Verify";

export interface CompanyInterface {
  data: CompanyInterface | PromiseLike<CompanyInterface>;
  ID?: number;
  company_name: string;
  logo: string;

  user_id: number;
  User?: UserInterface;

  address_id: number;
  Address?: AddressInterface;

  admin_id: number;
  Admin?: AdminInterface;

  Contact?: ContactInterface;
  Verify?: VerifyInterface;
  Intership_posts?: IntershipPostInterface[];
  Interview_appointments?: InterviewAppointmentInterface[];
  Reviews?: ReviewInterface[];
}
