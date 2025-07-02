export interface ApplicationInterface {
  id?: number; // Optional ID
  position: string; // Required position
  status: 'ผ่านการคัดเลือก' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก'; // Status field with predefined values
  companyNote?: string; // Optional company note
  resume?: string; // Optional resume
  transcript?: string; // Optional transcript
  submit_at?: string; // Optional submission timestamp
  internship_post_id?: number; // Optional internship post ID
}
