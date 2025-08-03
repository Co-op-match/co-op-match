export interface MatchResult {
  ID: number;
  post_id: number;
  post_name: string;
  company_name: string;
  score: number;
  matched_skills: number;
  total_required: number;
  gpa_matched: boolean;
  interest_matched: boolean;
  location_matched: boolean;
  gpa: number;
  min_gpa: number;
  ranking: number;
  recommend_reason: string[];
  weak_points: string[];
  skill_gap: string[];
  confidence_level: string;
  last_updated: string;
}