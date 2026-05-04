// ===== AUTH =====
export interface LoginRequest { username: string; password: string }
export interface LoginResponse {
  requires_mfa: boolean
  mfa_method?: 'None' | 'Sms' | 'Email' | 'GoogleAuth'
  mfa_token?: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
  user?: UserInfo
}
export interface MfaVerifyRequest { mfa_token: string; code: string }
export interface UserInfo {
  id: number; name: string; username: string; email: string
  role: 'SuperAdmin' | 'Admin' | 'SubAdmin' | 'CompanyUser'
  tenant_id: number; tenant_name?: string; language: string
  mfa_enabled: boolean; mfa_method: string
}

// ===== API RESPONSE =====
export interface ApiResponse<T> { success: boolean; data?: T; error?: string; errors?: Record<string, string[]> }
export interface PagedRequest { page: number; page_size: number; sort_by?: string; sort_desc?: boolean; search?: string }
export interface PagedResponse<T> { items: T[]; total: number; page: number; page_size: number; total_pages: number }

// ===== TENANTS =====
export interface Tenant {
  id: number; parent_tenant_id?: number; firm_name: string; domain: string
  currency?: string; credits: number; trusted_sender: boolean; refundable: boolean
  active: boolean; api_enabled: boolean; api_username?: string; api_request_count: number
  sms_services?: string[]; created_at: string
}

// ===== USERS =====
export interface User {
  id: number; tenant_id: number; tenant_name?: string; name: string; username: string
  email: string; phone?: string; role: string; language: string; active: boolean
  quota: number; mfa_enabled: boolean; mfa_method: string; created_at: string
}

// ===== ORDERS =====
export type OrderStatus = 'AwaitingApproval' | 'Waiting' | 'SendingStarted' | 'Completed' | 'Failed' | 'Cancelled'
export interface OrderListItem {
  id: number; tenant_name?: string; message: string; status: OrderStatus
  processed?: number; report_delivered?: number; report_total?: number
  send_at?: string; completed_at?: string; created_at: string
}
export interface OrderDetail {
  id: number; tenant_id: number; tenant_name?: string; use_service: string
  message: string; is_flash: boolean; is_manual: boolean; is_api: boolean
  status: OrderStatus; resendable: boolean; info?: OrderInfo
  send_at?: string; started_at?: string; completed_at?: string; cancelled_at?: string
  created_at: string; approved_by?: string; approved_at?: string
  initial_cost?: number; initial_fail?: number
  report_delivered?: number; report_undelivered?: number; report_expired?: number
  report_waiting?: number; report_total?: number
  refundable: boolean; refunded_at?: string; refund_amount?: number
  created_by_name?: string; send_errors?: string[]
}
export interface OrderInfo {
  uploaded: number; filtered: number; invalid: number; duplicate: number
  banned: number; blacklisted: number; processed: number; failed: number
  fields?: string[]; success: boolean; error?: string
}

// ===== CREDITS =====
export interface CreditTransaction {
  id: number; tenant_id: number; transaction_type: number; credit: number
  unit_price?: number; unit_price_currency?: string; total_price?: number
  confirmation_id?: string; confirmed_at?: string; created_at: string
}
export interface CreditBalance { tenant_id: number; firm_name: string; credits: number; currency: string }

// ===== DASHBOARD =====
export interface DashboardData {
  total_orders: number; today_orders: number; month_orders: number
  completed_orders: number; failed_orders: number; pending_orders: number
  total_delivered: number; total_undelivered: number; total_expired: number
  delivery_rate: number; total_tenants: number; total_credits: number
  recent_orders: { id: number; tenant_name?: string; message_preview: string; status?: string; processed?: number; delivered?: number; created_at: string }[]
}

// ===== TICKETS =====
export interface Ticket {
  id: number; opened_to: number; tenant_name?: string; name?: string; email?: string
  phone?: string; message: string; closed: number; response_count?: number; created_at: string
}
