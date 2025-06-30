import type { StudentInterface } from "./Student";
import type { ApplicationInterface } from "./Application";

export interface ApplicationDetailInterface {
  id: number;

  student_id: number;
  student?: StudentInterface;

  application_id: number;
  application?: ApplicationInterface;
}
