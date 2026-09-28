
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const { token, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Content-Type", "application/json");

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data as T;
}


export type UserRole = "ADMIN" | "EMPLOYEE" | "AGENT";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterResponse = {
  message?: string;
  user?: AuthUser;
};

export type MeResponse = AuthUser | { user: AuthUser };

export function getAuthUser(data: MeResponse): AuthUser {
  return "user" in data ? data.user : data;
}

export const TOKEN_KEY = "servicedesk_access_token";
