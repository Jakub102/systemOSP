const API_BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'osp_token';
const USER_KEY = 'osp_user';

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
  firehouse: { name: string } | null;
  roles: string[];
  full_name: string;
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
    request<Invitation>(`/v1/invitations/verify/${encodeURIComponent(token)}`),

  register: (payload: RegisterPayload) =>
    request<{ message: string }>('/v1/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string, deviceName: string) =>
    request<LoginResponse>('/v1/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: deviceName }),
    }),

  me: () => request<AuthUser>('/v1/me'),

  logout: () => request<{ message: string }>('/v1/logout', { method: 'POST' }),
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
