export interface OverviewInterface {
  totalApplications: number;
  interviewRate: number;
  offerRate: number;
  rejectRate: number;
  avgReviewScore?: number;
  topPost?: { postId: number; postName: string; applications: number };
  topPosts?: TopPostItem[];
  statusCounts?: Record<string, number>;
}
export type TopPostItem = {
  postId: number;
  postName: string;
  applications: number;
};
export interface TrendPointInterface { date: string; value: number }
export interface PipelineBucketInterface { name: string; value: number }
export interface PostPerfRowInterface {
  post_id: number; post_name: string; applications: number;
  interviewed: number; passed: number; avg_time_to_decision_days: number;
  avg_gpa?: number; min_gpa?: number; work_mode: string;
}
export interface InterviewStatsInterface {
  scheduled: number; no_show: number;
  mode: { mode: string; count: number; pass_rate?: number }[];
  avg_days_submit_to_schedule?: number;
  avg_days_schedule_to_decision?: number;
}