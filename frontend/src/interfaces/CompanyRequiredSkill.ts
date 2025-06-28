import type { SkillInterface } from './Skill';
// import type { InternshipPostInterface } from './InternshipPost';

export interface CompanyRequiredSkillInterface {
  ID?: number;                   // จาก gorm.Model.ID
  SkillID: number;
  IntershipPostID: number;
  Skill?: SkillInterface;               // ความสัมพันธ์ optional
//   IntershipPost?: InternshipPostInterface;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}