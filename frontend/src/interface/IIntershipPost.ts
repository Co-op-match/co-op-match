import type { CompanyInterface } from "../interfaces/Company";
import type { BenefitInterface } from "../interface/IBenefit";

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
  benefit_ids: number[]; // ✅ แก้ตรงนี้
  company_id: number;
  CompanyID: number;

  // ✅ ที่อยู่
  location_detail: string;
  subdistrict: string;
  district: string;
  province: string;

  // ✅ แสดงข้อมูลสัมพันธ์
  StatusPost?: {
    status_post: string;
  };
  Company?: CompanyInterface;
  Benefits?: BenefitInterface[]; // ✅ preload มาใช้แสดง
}
