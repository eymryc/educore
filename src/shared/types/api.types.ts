export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedList<T> {
  data: T[];
  meta: PaginationMeta;
}

export function emptyPaginationMeta(): PaginationMeta {
  return { current_page: 1, per_page: 10, total: 0, last_page: 1 };
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  institution_id: number | null;
  institution?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  roles: string[];
  permissions: string[];
  email_verified_at: string | null;
  created_at: string | null;
}

export interface LoginResult {
  token: string;
  token_type: string;
  user: AuthUser;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
