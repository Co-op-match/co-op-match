import type { GenderInterface } from "./Gender";
import type { UserInterface } from "./User";
import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { EducationInterface } from "./Education";

export interface StudentInterface {
  ID?: number;
  //data: any;
  id?: number;
  first_name?: string;
  last_name?: string;
  age?: number;
  birthday?: string;
  nationality?: string;
  religion?: string;
  phone_number?: string;
  height?: number;
  weight?: number;

  gender_id: number;
  user_id?: number;
  address_id?: number;
  admin_id?: number;

  Gender?: GenderInterface;
  User?: UserInterface;
  Address?: AddressInterface;
  Admin?: AdminInterface;
  Education?: EducationInterface[];
}
