import type { UniversityInterface } from "./UniversityInterface";
import type { FacultyInterface } from "./FacultyInterface";
import type { ProgramInterface } from "./ProgramInterface";
import type { EducationLevelInterface } from "./EducationLevel";

export interface EducationInterface {
  id?: number;
  user_id: number;

  university_id?: number;
  University: UniversityInterface;

  faculty_id?: number;
  Faculty: FacultyInterface;

  program_id?: number;
  Program: ProgramInterface;

  year: number;

  education_level_id?: number; // เพิ่ม ID สำหรับ join
  EducationLevel: EducationLevelInterface; // แทน string เดิม

  grade: number;
}
