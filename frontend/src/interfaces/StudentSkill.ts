import type { SkillInterface } from './Skill';
import type { StudentInterface } from './Student';

export interface StudentSkillInterface {
  id?: number;  
  ID?: number;          // จาก gorm.Model.ID
  SkillID: number;
  StudentID: number;
  Skill?: SkillInterface;      // ความสัมพันธ์ (optional)
  Student?: StudentInterface;  // ความสัมพันธ์ (optional)
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}