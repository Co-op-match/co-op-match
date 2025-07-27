import type { InternshipPostInterface } from "./IIntershipPost";

export interface ApplicationInterface {
  

  id?: number; // Optional ID
  position: string; // Required position
  status: 'ผ่านการคัดเลือก' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก' | 'รอนัดสัมภาษณ์' ; // Status field with predefined values
  companyNote?: string; // Optional company note
  resume_url?: string; // Optional resume
  TranscriptUrl?: string; // Optional transcript
  submit_at?: string; // Optional submission timestamp
  internship_post_id?: number; // Optional internship post ID

  // ✅ เพิ่มเพื่อใช้แสดงในตาราง
  company_name?: string;
  post_name?:string;
  date?: string;
  IntershipPost?: InternshipPostInterface;
  formatted_date: string;
}
