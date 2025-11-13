export interface Member {
  mem_id: number;
  mem_name: string;
  mem_phone?: string;
  mem_memo?: string;
  mem_manager?: string;
  mem_birth: string;
  mem_regist_date: string;
  mem_locker?: number;
  mem_locker_number_new?: string;
  mem_locker_number_old?: string;
  mem_checkin_number?: string;
  mem_gender?: number;
  mem_app_id?: string;
  mem_app_status?: string;
  mem_role?: string;
  push_yn?: string;
  push_token?: string;
  app_reg_dt?: string;
  app_active_dt?: string;
  center_id: number;
  center_name: string;
  sch_time: string;
  image?: string;
  memo_purchase_date: string;
  memo_start_date: string;
  memo_end_date: string;
  memo_remaining_counts: string;
  memo_pro_name: string;
  memo_status: number;
  order_seq: number;
}

export interface ClientLog {
  ccl_id: number;
  ccl_name: string;
  ccl_phone: string;
  ccl_memo: string;
  ccl_date: string;
}

export interface Schedule {
  sch_id: number;
  sch_time: string;
  sch_info: string;
  sch_max_cap: number;
  current_count: number;
  upcoming_count: number;
}

export interface Product {
  pro_id?: number;
  pro_name: string;
  pro_type: string;
  pro_months: number;
  pro_week: number;
  pro_remaining_counts: number;
  pro_price: number;
  pro_class: string;
}

export interface Target {
  target_amount_month: number;
  target_amount_year: number;
  target_members: number;
}

export interface Sales {
  total_sum_year: number;
  total_sum_month: number;
}

export interface Notification {
  not_id: number;
  not_type: string;
  not_title: string;
  not_message: string;
  not_created_at: string;
  not_is_read: number;
}

export interface Center {
  center_id: number;
  center_name: string;
  monthly_sales?: number;
  annual_sales?: number;
}

export interface UpdateLog {
  up_id: number;
  up_ver: string;
  up_desc: string;
}

export interface NoticeType {
  no_id: number;
  no_desc: string;
  no_background: string;
  no_text: string;
}

export interface GuidelineType {
  gl_id: number;
  gl_desc: string;
  gl_background: string;
  gl_text: string;
}

export interface LockerType {
  order_seq: number;
  locker_id: number;
  center_id: number;
  rows: number;
  cols: number;
  locker_type: string;
  locker_memo: string;
  locker_gender: string;
  array_type: string;
  array_form: string;
  array_direction: string;
  del_yn: string;
  table: boolean | null | number[][];
  sort_type: "FREE" | "LEFT_TOP" | "RIGHT_TOP" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";
  direction: "RIGHT" | "DOWN" | "LEFT" | "UP";
}

export interface LockerBasData {
  locker_id: number;
  center_id: number;
  rows: number;
  cols: number;
  locker_type: string;
  locker_memo: string;
  locker_gender: string;
  array_type: string;
  array_form: string;
  array_direction: string;
  del_yn: string;
  order_seq: number;
}

export interface LockerDetail {
  locker_end_dt: string;
  locker_id: number;
  locker_number: number;
  locker_start_dt: string;
  locker_status: string;
  locker_type: string;
  locker_memo: string | null;
  locker_gender: string;
  locker_detail_memo: string;
  array_type: string;
  array_form: string;
  array_direction: string;
  mem_gender: string | null;
  mem_id: number | null;
  mem_name: string | null;
  mem_phone: string | null;
  free_position?: number;
}
