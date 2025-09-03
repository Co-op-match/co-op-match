import type { UserInterface } from "./User";
import type { AddressInterface } from "./Address";
import type { AdminInterface } from "./Admin";
import type { GenderInterface } from "./Gender";
import type { UniversityInterface } from "./UniversityInterface";
import type { FacultyInterface } from "./FacultyInterface";
import type { ProgramInterface } from "./ProgramInterface";
import type { ContactInterface } from "./Contact";

export interface AcademicStaffInterface {

  id: number;
  ID?: number;
  academic_position: string;
  age: number;
  university_id?: number;
  University: UniversityInterface;

  faculty_id?: number;
  Faculty: FacultyInterface;

  program_id?: number;
  Program: ProgramInterface;

  verify: boolean;


  UserID?: number;
  address_id?: number;
  AdminID?: number;
  gender_id?: number;

  first_name?: string;
  last_name?: string;

  User?: UserInterface;
  Address?: AddressInterface;
  Admin?: AdminInterface;
  Gender?: GenderInterface;
  Contact?: ContactInterface;
}
