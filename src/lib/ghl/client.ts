const BASE_URL = process.env.GHL_API_BASE_URL ?? "https://services.leadconnectorhq.com";
const VERSION = process.env.GHL_API_VERSION ?? "2021-07-28";

export class GhlApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`GHL API error (${status}): ${JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }
}

async function ghlFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.GHL_PRIVATE_TOKEN;
  if (!token) throw new Error("GHL_PRIVATE_TOKEN is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: VERSION,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new GhlApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const ghl = {
  get: <T>(path: string) => ghlFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    ghlFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    ghlFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    ghlFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => ghlFetch<T>(path, { method: "DELETE" }),
};
