import type { UserInterface } from "./User";
import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { GenderInterface } from "./Gender";

export interface AcademicStaffInterface {
  id: number;
  academic_position: string;
  age: number;
  faculty: string;
  department: string;
  university: string;
  verify: boolean;

  user_id: number;
  address_id: number;
  AdminID: number;
  gender_id: number;

  first_name?: string;
  last_name?: string;

  User?: UserInterface;
  Address?: AddressInterface;
  Admin?: AdminInterface;
  Gender?: GenderInterface;
}
