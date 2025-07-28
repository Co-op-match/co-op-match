import type { ApplicationInterface } from "../interface/IApplication";
import type { StatusPostInterface } from "../interface/IStatusPost";

export interface IntershipPostInterface {
  WorkModeID?: number;
  WorkDayID?: number;
  StipendID?: number;
  JobTypeID?: number;
  Benefits: any;
  ID?: number;
  post_name?: string;
  post_description?: string;
  qualifications?: string;
  quantity?: number;
  min_gpa?: string;
  Company?: {
    company_name: string;
    logo: string;
    Address?: {
      Province?: {
        ID: number;
        name_th: string; 
      };
    };
  };
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
  Benefit?: {
    benefit: string;
  };

  StatusPost?: StatusPostInterface;
  Applications?: ApplicationInterface[];

  location_detail: string;
  subdistrict: string;
  district: string;
  province: string;
  
}
