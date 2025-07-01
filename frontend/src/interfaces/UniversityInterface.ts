import type { FacultyInterface } from "./FacultyInterface";

export interface UniversityInterface {
  id: number;
  name_th: string;
  faculties: FacultyInterface[];
}