import type { RoleInterface } from "./Role";
import type { ProfileImageInterface } from "./ProfileImage";
export interface UserInterface {
  ID: number;
  Email: string;
  is_active: boolean;
  RoleID: number;
  Role?: RoleInterface;
  ProfileImage?: ProfileImageInterface;
}
