import type { CompanyInterface } from "../interfaces/Company";
export interface InternshipPostInterface {
  status_post: string;
  ID?: number;
  post_name: string;
  post_description: string;
  qualifications: string;
  quantity: number;
  min_gpa: number;
  created_at: string;
  JobTypeID: number;
  StipendID: number;
  WorkDayID: number;
  WorkModeID: number;
  StatusPostID: number;
  benefit_id: number;
  company_id: number;

  // ✅ ที่อยู่
  location_detail: string;
  subdistrict: string;
  district: string;
  province: string;

  // ✅ สำหรับแสดงสถานะ (เช่น Active/Inactive)
  StatusPost?: {
    status_post: string;
  };

  Company?: CompanyInterface;
}