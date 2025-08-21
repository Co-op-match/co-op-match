export interface KPIResponse {
  total_applications: number;
  matched_applications: number;
  matching_success_rate: number; // 0..1
  avg_company_review_score: number;
  applications_last_7d: number;
}

export interface TimeSeriesPoint { date: string; value: number }
export interface TrendResponse { series: TimeSeriesPoint[] }

export interface MajorTrendItem { label: string; value: number }
export interface MajorTrendResponse { items: MajorTrendItem[] }

export interface ReviewSummary {
  avg_rating: number;
  buckets: Record<string, number>; // "1".."5"
}