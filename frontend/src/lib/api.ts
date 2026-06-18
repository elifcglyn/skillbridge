import { supabase } from "./supabase";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function getLocalApiUrls() {
  const hosts = new Set(["localhost", "127.0.0.1"]);

  if (typeof window !== "undefined" && window.location.hostname) {
    hosts.add(window.location.hostname);
  }

  return ["5000", "4000"].flatMap((port) =>
    [...hosts].map((host) => `http://${host}:${port}`),
  );
}

const API_BASE_URLS = Array.from(
  new Set([configuredApiUrl, ...getLocalApiUrls()].filter(Boolean).map(stripTrailingSlash)),
);

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : "API isteği başarısız oldu.";
    throw new Error(message);
  }

  return payload as T;
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  let lastNetworkError: unknown;
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error("API isteği için geçerli bir oturum bulunamadı.");
  }

  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${session.access_token}`);

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
      });
      return parseJsonResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    lastNetworkError instanceof Error
      ? `API sunucusuna ulaşılamadı: ${lastNetworkError.message}`
      : "API sunucusuna ulaşılamadı.",
  );
}

export async function apiGet<T>(path: string) {
  return apiRequest<T>(path);
}

export async function apiSend<T>(path: string, method: "POST" | "PUT" | "PATCH", body: unknown) {
  const headers = new Headers();
  headers.set("content-type", "application/json");

  return apiRequest<T>(path, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

export function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}
