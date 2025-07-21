import type { GenderInterface } from "./Gender";
import type { UserInterface } from "./User";
import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { EducationInterface } from "./Education";
import type { StudentSkillInterface } from "../interfaces/StudentSkill";
import type { StudentInterestInterface } from "../interfaces/StudentInterest";

export interface StudentInterface {
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

  StudentSkill?: StudentSkillInterface[];  // ✅ ต้องตรงกับ key ที่ backend ส่ง
  StudentInterest?: StudentInterestInterface[];  // ✅ เช่นกัน
}
