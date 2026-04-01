// ============================================================
// Shared Types — Treatment Builder Multi-Tenant SaaS
// ============================================================

// --- Roles ---
export type UserRole = 'platform_admin' | 'center_admin' | 'center_staff';

// --- Tenant ---
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: 'active' | 'inactive' | 'suspended';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_plan: BillingPlan;
  billing_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type BillingPlan = 'free' | 'starter' | 'professional' | 'enterprise';

// --- Tenant Location ---
export interface TenantLocation {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

// --- User Profile ---
export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// --- Widget Config ---
export type WidgetMode =
  | 'regions_services'
  | 'regions_concerns'
  | 'treatment_builder';

export type DiagramType = 'face' | 'body' | 'full_body';

export type RegionStyle = 'diagram' | 'cards';

export type WidgetLayout = 'split' | 'guided';

export interface WidgetConfig {
  id: string;
  tenant_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  logo_url: string | null;
  cta_text: string;
  success_message: string;
  redirect_url: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  notification_emails: string[];
  allowed_origins: string[];
  custom_css: string | null;
  widget_mode: WidgetMode;
  diagram_type: DiagramType;
  region_style: RegionStyle;
  widget_layout: WidgetLayout;
  created_at: string;
  updated_at: string;
}

// --- Body Region ---
export type Gender = 'female' | 'male' | 'all';

export interface BodyRegion {
  id: string;
  tenant_id: string | null; // null = platform default
  name: string;
  slug: string;
  gender: Gender;
  body_area: 'face' | 'body';
  display_order: number;
  hotspot_x: number | null;
  hotspot_y: number | null;
  diagram_view: 'front' | 'back' | 'face' | null;
  card_description: string | null;
  display_group: 'face' | 'upper_body' | 'lower_body' | null;
  is_active: boolean;
  created_at: string;
}

// --- Concern ---
export interface Concern {
  id: string;
  tenant_id: string | null; // null = platform default
  body_region_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// --- Form Field ---
export type FormFieldType = 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'location';

export interface FormField {
  id: string;
  tenant_id: string;
  field_key: string | null;
  field_type: FormFieldType;
  label: string;
  placeholder: string | null;
  options: string[] | null; // for select, radio, checkbox
  is_required: boolean;
  display_order: number;
  created_at: string;
}

// --- Form Submission ---
export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';

export interface FormSubmission {
  id: string;
  tenant_id: string;
  location_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  gender: Gender;
  selected_regions: SelectedRegion[];
  selected_concerns: SelectedConcern[];
  selected_services: SelectedService[];
  custom_fields: Record<string, unknown>;
  source_url: string | null;
  lead_status: LeadStatus;
  notes: string | null;
  webhook_status: 'pending' | 'sent' | 'failed' | null;
  webhook_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectedRegion {
  region_id: string;
  region_name: string;
  region_slug: string;
}

export interface SelectedConcern {
  concern_id: string;
  concern_name: string;
  region_id: string;
  region_name: string;
}

export interface SelectedService {
  service_id: string;
  service_name: string;
  category_name: string;
}

// --- Service Category ---
export interface ServiceCategory {
  id: string;
  tenant_id: string | null; // null = platform default
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Service ---
export interface Service {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// --- Service ↔ Body Region Junction ---
export interface ServiceBodyRegion {
  id: string;
  service_id: string;
  body_region_id: string;
  created_at: string;
}

// --- Concern ↔ Service Junction ---
export interface ConcernService {
  id: string;
  concern_id: string;
  service_id: string;
  created_at: string;
}

// --- Location ↔ Service Junction ---
export interface LocationService {
  id: string;
  location_id: string;
  service_id: string;
  created_at: string;
}

// --- API Key ---
export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  key_prefix: string; // first 8 chars for identification
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

// --- Audit Log ---
export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// --- Widget Config API Response ---
export interface WidgetConfigResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  branding: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    cta_text: string;
    success_message: string;
    redirect_url: string | null;
    custom_css: string | null;
  };
  widget_mode: WidgetMode;
  diagram_type: DiagramType;
  region_style: RegionStyle;
  widget_layout: WidgetLayout;
  regions: WidgetRegion[];
  service_categories: WidgetServiceCategory[];
  form_fields: WidgetFormField[];
  locations: WidgetLocation[];
}

export interface WidgetLocation {
  id: string;
  name: string;
  is_primary: boolean;
  city: string | null;
  state: string | null;
}

export interface WidgetServiceCategory {
  id: string;
  name: string;
  slug: string;
  services: WidgetService[];
}

export interface WidgetService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  region_ids: string[];
  concern_ids: string[];
}

export interface WidgetRegion {
  id: string;
  name: string;
  slug: string;
  gender: Gender;
  body_area: 'face' | 'body';
  display_order: number;
  hotspot_x: number | null;
  hotspot_y: number | null;
  diagram_view: 'front' | 'back' | 'face' | null;
  card_description: string | null;
  display_group: 'face' | 'upper_body' | 'lower_body' | null;
  concerns: WidgetConcern[];
}

export interface WidgetConcern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

export interface WidgetFormField {
  id: string;
  field_key: string | null;
  field_type: FormFieldType;
  label: string;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
}

// --- Widget Submission Payload ---
export interface WidgetSubmissionPayload {
  tenant_id: string;
  location_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender: Gender;
  selected_regions: SelectedRegion[];
  selected_concerns: SelectedConcern[];
  selected_services: SelectedService[];
  custom_fields: Record<string, unknown>;
  sms_opt_in?: boolean;
  email_opt_in?: boolean;
  source_url: string;
}
