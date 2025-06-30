import type { CompanyInterface } from "./Company";
import type { StudentInterface } from "./Student";

export interface InterviewAppointmentInterface {
  id?: number;
  appointment_date?: string;
  status?: string;
  mode?: string;
  details?: string;

  company_id?: number;
  company?: CompanyInterface;

  student_id?: number;
  student?: StudentInterface;
}
