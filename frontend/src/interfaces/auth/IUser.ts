export interface UsersInterface {
  [x: string]: string | undefined;
  Email?: string;
  Password?: string;
  ConfirmPassword?: string;
  RoleName?: string; // ต้องมี field นี้
}
