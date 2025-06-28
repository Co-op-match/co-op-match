import type { StudentSkillInterface } from './StudentSkill';
import type { CompanyRequiredSkillInterface } from './CompanyRequiredSkill';

export interface SkillInterface {
  id?: number;  
  ID?: number;           // ใช้แทน gorm.Model.ID (uint)
  skill_name: string;    // ตาม json:"skill_name"
  // ความสัมพันธ์ (optional) ถ้าต้องการใช้
  StudentSkill?: StudentSkillInterface[];
  CompanyRequiredSkill?: CompanyRequiredSkillInterface[];
}