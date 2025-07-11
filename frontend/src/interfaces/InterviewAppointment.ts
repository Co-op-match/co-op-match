import type { CompanyInterface } from "./Company";
import type { StudentInterface } from "./Student";

export interface InterviewAppointmentInterface {
  ID?: number;
  appointment_date: string;
  status: string;
  mode: string;
  details: string;

  company_id: number;
  Company?: CompanyInterface;

  student_id: number;
  Student?: StudentInterface;
}
