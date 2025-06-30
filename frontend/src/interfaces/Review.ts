import type { CompanyInterface } from "./Company";
import type { StudentInterface } from "./Student";

export interface ReviewInterface {
  id?: number;
  rating?: number;
  comment?: string;
  created_at?: string;

  student_id?: number;
  student?: StudentInterface;

  company_id?: number;
  company?: CompanyInterface;
}
