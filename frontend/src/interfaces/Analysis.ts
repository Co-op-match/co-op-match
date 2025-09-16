export interface OverviewInterface {
  totalApplications?: number;
  interviewRate?: number;
  offerRate?: number;
  rejectRate?: number;
  avgReviewScore?: number;
  topPost?: { postId?: number; postName?: string; applications?: number };
  topPosts?: TopPostItem[];
  statusCounts?: Record<string, number>;
}
export interface TopPostItem {
  postId?: number;
  postName?: string;
  applications?: number;
}
export interface TrendPointInterface {
  date?: string;
  value?: number;
}
export interface PipelineBucketInterface {
  name?: string;
  value?: number;
}
export interface PostPerfRowInterface {
  post_id?: number;
  post_name?: string;
  applications?: number;
  interviewed?: number;
  passed?: number;
  avg_time_to_decision_days?: number;
  avg_gpa?: number;
  min_gpa?: number;
  work_mode?: string;
}
export interface InterviewStatsInterface {
  scheduled?: number;
  no_show?: number;
  mode?: { mode?: string; count?: number; pass_rate?: number }[];
  avg_days_submit_to_schedule?: number;
  avg_days_schedule_to_decision?: number;
}

export interface MonthlyUserByRoleInterface {
  month?: string;
  students?: number;
  companies?: number;
  academic_staff?: number;
  admins?: number;
}

export interface LatestPendingApplicantInterface {
  application_id: number;
  status: string;
  submit_at: string;
  company_note?: string;
  post_id: number;
  post_name: string;
  student_id: number;
  student_full_name: string;
  student_phone?: string;
  interview_id?: number | null;
  interview_at?: string | null;
  student_image_url?: string | null;
}

//==============================   Academic Staff   ==============================
export interface KVInterface {
  key?: string;
  count?: number;
}

export interface AcademicOverviewInterface {
  university_id?: number;
  students?: number;
  applications_by_status?: KVInterface[];
  interviews_upcoming?: number;
  reviews_total?: number;
}

export interface AcademicStudentItemInterface {
  id?: number;
  first_name?: string;
  last_name?: string;
  gender?: string;
  age?: number;
  program_name?: string;
  faculty_name?: string;
  university_name?: string;
  applications_total?: number;
}

export interface ListAcademicStudentsResponseInterface {
  university_id?: number;
  total?: number;
  page?: number;
  page_size?: number;
  items?: AcademicStudentItemInterface[];
}

export interface AcademicApplicationItemInterface {
  id?: number;
  status?: string;
  submit_at?: string;
  company_name?: string;
  post_name?: string;
  student_id?: number;
  student_full_name?: string;
}

export interface ListAcademicApplicationsResponseInterface {
  university_id?: number;
  total?: number;
  page?: number;
  page_size?: number;
  items?: AcademicApplicationItemInterface[];
}

export interface AcademicTrendPoint {
  date?: string;
  total?: number;
  pass?: number;
  review?: number;
  interviewed?: number;
  waiting?: number; // บางระบบส่งเป็น waiting
  waiting_schedule?: number; // บางระบบส่งเป็น waiting_schedule
  fail?: number;
}

// ==========================    Job Match    ==========================
export interface UpliftSideInterface {
  total: number;
  pass: number;
  fail: number;
  pass_rate: number | null; // เปลี่ยนให้รองรับ null
  fail_rate: number | null; // เปลี่ยนให้รองรับ null
  sufficient: boolean;      // ใหม่
}

export interface UpliftRespInterface {
  recommended: UpliftSideInterface;
  non_recommended: UpliftSideInterface;
  uplift_pass_rate: number | null; // เปลี่ยนให้รองรับ null
  min_sample: number;              // ใหม่
  note?: string;                   // ใหม่ (optional)
}

// ========== Popular ==========
// สาขายอดนิยม (แทนงานยอดนิยม)
export interface PopularMajorInterface {
  job_type: string;
  apply_count: number;
};

// บริษัทยอดนิยม
export interface PopularCompanyInterface {
  company_id: number;
  company_name: string;
  apply_count: number;
};

