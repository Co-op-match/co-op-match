import type { ProgramInterface } from "./ProgramInterface";

export interface FacultyInterface {
  id: number;
  name_th: string;
  university_id: number;
  Programs: ProgramInterface[];
}