import type { RoleInterface } from "./Role";
import type { ProfileImageInterface } from "./ProfileImage";
import type { StudentInterface } from "./Student";
import type { VerifyInterface } from "./Verify";

export interface UserInterface {
  ID: number;
  Email: string;
  is_active: boolean;
  RoleID: number;
  Role?: RoleInterface;
  ProfileImage?: ProfileImageInterface[];
  Student?: StudentInterface[];
  Verifications?: VerifyInterface[];
}
