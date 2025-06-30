import type { AdminInterface } from "./Admin";
import type { ApplicationInterface } from "./Application";
import type { BenefitInterface } from "./Benefit";
import type { CompanyInterface } from "./Company";
import type { JobTypeInterface } from "./JobType";
import type { StatusPostInterface } from "./StatusPost";
import type { StipendInterface } from "./Stipend";
import type { WorkDayInterface } from "./WorkDay";
import type { WorkModeInterface } from "./WorkMode";

export interface InternshipPostInterface {
  id?: number;
  post_name?: string;
  post_description?: string;
  qualifications?: string;
  quantity?: number;
  min_gpa?: string;
  created_at?: string;

  company_id?: number;
  company?: CompanyInterface;

  job_type_id?: number;
  job_type?: JobTypeInterface;

  stipend_id?: number;
  stipend?: StipendInterface;

  work_day_id?: number;
  work_day?: WorkDayInterface;

  work_mode_id?: number;
  work_mode?: WorkModeInterface;

  status_post_id?: number;
  status_post?: StatusPostInterface;

  admin_id?: number;
  admin?: AdminInterface;

  benefit_id?: number;
  benefit?: BenefitInterface;

  applications?: ApplicationInterface[];
}