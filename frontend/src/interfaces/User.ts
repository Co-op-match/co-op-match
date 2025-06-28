import type { RoleInterface } from "./Role";
import type { ProfileImageInterface } from "./ProfileImage";
import type { StudentInterface } from "./Student";
export interface UserInterface {
  ID: number;
  Email: string;
  is_active: boolean;
  RoleID: number;
  Role?: RoleInterface;
  ProfileImage?: ProfileImageInterface[];
  Student?: StudentInterface[];
}
