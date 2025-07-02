import type { InterestInterface } from './Interest';
import type { StudentInterface } from './Student';

export interface StudentInterestInterface {
  id?: number;  
  ID?: number;          // จาก gorm.Model.ID
  InterestID: number;
  StudentID: number;
  Interest?: InterestInterface;    // ความสัมพันธ์ (optional)
  Student?: StudentInterface;      // ความสัมพันธ์ (optional)
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}