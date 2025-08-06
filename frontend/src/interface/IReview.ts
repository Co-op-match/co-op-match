// IReview.ts
import type { StudentInterface } from "../interfaces/Student";
import type { CompanyInterface } from "../interfaces/Company";

export interface ReviewInterface {
  id?: number;
  rating: number;
  comment: string;
  created_at?: string; // ✅ ไม่ต้องใส่ตอนสร้าง
  StudentID: number;
  Student?: StudentInterface;
  CompanyID: number;
  Company?: CompanyInterface;
}

// ✅ ใช้ตัวนี้ตอน submit
export interface ReviewPayload {
  rating: number;
  comment: string;
  StudentID: number;
  CompanyID: number;
  tags?: Tag[]; 
}
