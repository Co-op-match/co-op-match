import type { RoleInterface } from "./Role";
import type { ProfileImageInterface } from "./ProfileImage";
import type { StudentInterface } from "./Student";
import type { CompanyInterface } from "./Company";
export interface UserInterface {
  ID: number;
  Email: string;
  is_active: boolean;
  RoleID: number;
  Role?: RoleInterface;
  ProfileImage?: ProfileImageInterface[];
  Student?: StudentInterface[];
  Company?: CompanyInterface[];
}
