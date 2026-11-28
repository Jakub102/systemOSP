const API_BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'osp_token';
const USER_KEY = 'osp_user';
const PENDING_INVITATIONS_KEY = 'osp_pending_invitations';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export interface Invitation {
  id: number;
  email: string;
  expires_at: string | null;
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  firehouse: { 
    id?: number;
    name: string;
    street?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  roles: string[];
  full_name: string;
}

export interface CreateIncidentPayload {
  main_category: 'F' | 'LT' | 'A' | 'M' | 'FA';
  sub_category: string;
  description?: string;
  incident_time: string;
  address: string;
  latitude: number;
  longitude: number;
  status?: 'ACTIVE' | 'END';
}

export interface IncidentLocationUser {
  first_name: string;
  last_name: string;
  full_name: string;
  roles: string[];
  attendance_status: 'accepted' | 'on_scene' | 'rejected' | 'pending' | string;
  latitude: number | null;
  longitude: number | null;
}

export interface IncidentLocationData {
  id: number | string;
  external_id?: string;
  main_category: string;
  sub_category: string;
  address: string;
  latitude: number;
  longitude: number;
  users: IncidentLocationUser[];
}

export interface IncidentLocationResponse {
  data: IncidentLocationData;
}

export interface IncidentColorTheme {
  id: number;
  name: string;
  hex: string;
  borderClass: string;
  borderHex: string;
  bgLightClass: string;
  bgTint: string;
  textClass: string;
  badgeClass: string;
  glow: string;
}

export const INCIDENT_PALETTE: IncidentColorTheme[] = [
  {
    id: 0,
    name: 'Czerwony',
    hex: '#dc2626',
    borderClass: 'border-red-600',
    borderHex: '#dc2626',
    bgLightClass: 'bg-red-50/90',
    bgTint: '#fef2f2',
    textClass: 'text-red-700',
    badgeClass: 'bg-red-600 text-white',
    glow: 'rgba(220, 38, 38, 0.45)',
  },
  {
    id: 1,
    name: 'Zielony',
    hex: '#16a34a',
    borderClass: 'border-emerald-600',
    borderHex: '#16a34a',
    bgLightClass: 'bg-emerald-50/90',
    bgTint: '#ecfdf5',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-600 text-white',
    glow: 'rgba(22, 163, 74, 0.45)',
  },
  {
    id: 2,
    name: 'Niebieski',
    hex: '#2563eb',
    borderClass: 'border-blue-600',
    borderHex: '#2563eb',
    bgLightClass: 'bg-blue-50/90',
    bgTint: '#eff6ff',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-600 text-white',
    glow: 'rgba(37, 99, 235, 0.45)',
  },
  {
    id: 3,
    name: 'Bursztynowy',
    hex: '#d97706',
    borderClass: 'border-amber-600',
    borderHex: '#d97706',
    bgLightClass: 'bg-amber-50/90',
    bgTint: '#fffbeb',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-600 text-white',
    glow: 'rgba(217, 119, 6, 0.45)',
  },
  {
    id: 4,
    name: 'Fioletowy',
    hex: '#9333ea',
    borderClass: 'border-purple-600',
    borderHex: '#9333ea',
    bgLightClass: 'bg-purple-50/90',
    bgTint: '#faf5ff',
    textClass: 'text-purple-700',
    badgeClass: 'bg-purple-600 text-white',
    glow: 'rgba(147, 51, 234, 0.45)',
  },
];

export function getIncidentTheme(index: number): IncidentColorTheme {
  return INCIDENT_PALETTE[index % INCIDENT_PALETTE.length];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  token: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
}

export interface CreateInvitationPayload {
  email: string;
  role_id: number;
}

export interface PendingInvitation {
  id: number;
  email: string;
  role_id?: number;
  role_name?: string;
  expires_at: string | null;
  created_at?: string;
}

export interface RoleOption {
  id: number;
  name: string;
  label: string;
}

export const INVITATION_ROLES: RoleOption[] = [
  { id: 3, name: 'firefighter', label: 'Strażak' },
  { id: 10, name: 'captain', label: 'Dowódca' },
  { id: 11, name: 'driver', label: 'Kierowca' },
  { id: 12, name: 'lifeguard', label: 'Ratownik' },
  { id: 6, name: 'chief', label: 'Naczelnik' },
  { id: 7, name: 'chiefassistent', label: 'Zastępca Naczelnika' },
  { id: 4, name: 'president', label: 'Prezes' },
  { id: 5, name: 'vicepresident', label: 'Zastępca Prezesa' },
  { id: 8, name: 'quartermaster', label: 'Gospodarz' },
  { id: 9, name: 'treasurer', label: 'Skarbnik' },
  { id: 2, name: 'admin', label: 'Administrator' },
];

export const INITIAL_DEMO_INVITATIONS: PendingInvitation[] = [
  {
    id: 1,
    email: 'kandydat1@vfd.pl',
    role_id: 3,
    role_name: 'Strażak',
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const body = options.body;
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Nie można połączyć się z serwerem. Sprawdź, czy backend jest uruchomiony.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof data?.message === 'string' ? data.message : `Błąd serwera (${res.status})`,
      data?.errors,
    );
  }

  return data as T;
}

export const api = {
  verifyInvitation: (token: string) =>
    request<Invitation>(`/invitations/verify/${encodeURIComponent(token)}`),

  createInvitation: (payload: CreateInvitationPayload) =>
    request<{ message: string; data: Invitation }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteInvitation: (id: number) =>
    request<{ message: string }>(`/invitations/${id}`, {
      method: 'DELETE',
    }),

  getInvitations: async (): Promise<PendingInvitation[]> => {
    const res = await request<PendingInvitation[] | { data: PendingInvitation[] }>('/invitations');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data: PendingInvitation[] }).data)) {
      return (res as { data: PendingInvitation[] }).data;
    }
    return [];
  },

  createIncident: (payload: CreateIncidentPayload) =>
    request<{ data: any }>('/incident/new', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIncidentLocation: (incidentId: number | string) =>
    request<IncidentLocationResponse>(`/incidents/${incidentId}/location`),

  register: (payload: RegisterPayload) =>
    request<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string, deviceName: string) =>
    request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: deviceName }),
    }),

  me: async (): Promise<AuthUser> => {
    const res = await request<AuthUser | { user: AuthUser } | { data: AuthUser }>('/me');
    let user: AuthUser;
    if (res && 'user' in res && res.user) {
      user = res.user;
    } else if (res && 'data' in res && (res as any).data) {
      user = (res as any).data;
    } else {
      user = res as AuthUser;
    }

    if (!Array.isArray(user.roles)) {
      user.roles = [];
    }
    if (!user.full_name) {
      user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Użytkownik';
    }
    return user;
  },

  logout: () => request<{ message: string }>('/logout', { method: 'POST' }),
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    const user: AuthUser = (parsed.user && typeof parsed.user === 'object') ? parsed.user : parsed;
    if (!Array.isArray(user.roles)) {
      user.roles = [];
    }
    if (!user.full_name) {
      user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Użytkownik';
    }
    return user;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser | { user: AuthUser }): void {
  const normalizedUser: AuthUser = (user && 'user' in user && user.user) ? (user.user as AuthUser) : (user as AuthUser);
  if (!Array.isArray(normalizedUser.roles)) {
    normalizedUser.roles = [];
  }
  if (!normalizedUser.full_name) {
    normalizedUser.full_name = `${normalizedUser.first_name || ''} ${normalizedUser.last_name || ''}`.trim() || 'Użytkownik';
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredPendingInvitations(): PendingInvitation[] {
  const raw = localStorage.getItem(PENDING_INVITATIONS_KEY);
  if (!raw) return INITIAL_DEMO_INVITATIONS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_INVITATIONS;
  } catch {
    return INITIAL_DEMO_INVITATIONS;
  }
}

export function saveStoredPendingInvitations(invitations: PendingInvitation[]): void {
  localStorage.setItem(PENDING_INVITATIONS_KEY, JSON.stringify(invitations));
}
