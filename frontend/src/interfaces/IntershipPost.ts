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
  
}
