import type { InternshipPostInterface } from "./IIntershipPost";
import type { StudentInterface } from "../interfaces/Student"; // 🔹 เพิ่ม import นี้ด้วย

export interface ApplicationInterface {
  id?: number;
  position: string;
  status: 'ผ่าน' | 'กำลังพิจารณา' | 'ไม่ผ่าน' | 'รอนัดสัมภาษณ์' | 'นัดสัมภาษณ์แล้ว';
  company_note?: string;
  resume_url?: string;
  TranscriptUrl?: string;
  submit_at?: string;
  internship_post_id?: number;
  company_name?: string;
  company_id?: number;
  post_name?: string;
  date?: string;
  formatted_date: string;

  // ✅ เพิ่ม 2 บรรทัดนี้
  StudentID?: number;
  Student?: StudentInterface;

  IntershipPost?: InternshipPostInterface;

  interview_appointment?: {
    appointment_date: string;
    mode: string;
    details: string;
  };
}
