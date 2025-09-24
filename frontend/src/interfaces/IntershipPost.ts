import type { ApplicationInterface } from "../interface/IApplication";
import type { StatusPostInterface } from "../interface/IStatusPost";
import type { CompanyInterface } from "./Company";
import type { BenefitInterface } from "./Benefit";

export interface IntershipPostInterface {
  WorkModeID?: number;
  WorkDayID?: number;
  StipendID?: number;
  JobTypeID?: number;
  //Benefits: any;
  ID?: number;
  post_name?: string;
  post_description?: string;
  qualifications?: string;
  quantity?: number;
  min_gpa?: string;
  CompanyID?: number;
  Company?: CompanyInterface;
  WorkMode?: {
    work_mode: string;
  };
  Stipend?: {
    stipend: string;
  };
  WorkDay?: {
    work_day: string;
  };
  JobType?: {
    job_type: string;
  };
  StatusPostID?: number;
  AdminID?: number;
  BenefitID?: number;
 benefits?: BenefitInterface[];

  StatusPost?: StatusPostInterface;
  Applications?: ApplicationInterface[];

  location_detail: string;
  subdistrict: string;
  district: string;
  province: string;

  CreatedAt?: string;
  created_at?: string;
}
