export const LEAD_STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

export const TENANT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
};

export const PLAN_STYLES: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export const ROLE_STYLES: Record<string, string> = {
  platform_admin: 'bg-red-100 text-red-700',
  center_admin: 'bg-blue-100 text-blue-700',
  center_staff: 'bg-gray-100 text-gray-700',
};

export const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  center_admin: 'Admin',
  center_staff: 'Staff',
};

export const GENDER_STYLES: Record<string, string> = {
  female: 'bg-pink-100 text-pink-700',
  male: 'bg-blue-100 text-blue-700',
  all: 'bg-gray-100 text-gray-700',
};

export const BODY_AREA_STYLES: Record<string, string> = {
  face: 'bg-amber-100 text-amber-700',
  body: 'bg-teal-100 text-teal-700',
};
