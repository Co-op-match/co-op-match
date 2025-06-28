import type { StudentInterestInterface } from './StudentInterest';

export interface InterestInterface {
  id?: number;  
  ID?: number;           // gorm.Model.ID
  interest_name: string; // ตาม json:"interest_name"
  StudentInterest?: StudentInterestInterface[];
}