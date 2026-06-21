import { supabase } from "./supabase";

// Sadece Vercel'deki Environment Variable'ı kullan, yoksa hata almamak için render adresine yönlendir
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || "https://skillbridge-93jk.onrender.com";

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

// Sadece tek bir gerçek API adresi kullanıyoruz
const API_BASE_URLS = [stripTrailingSlash(configuredApiUrl)];

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

  // Artık sadece tek bir (ve doğru olan) URL'e istek atıyor
  const baseUrl = API_BASE_URLS[0];
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
    return parseJsonResponse<T>(response);
  } catch (error) {
    throw new Error(`API sunucusuna ulaşılamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
  }
}

export async function apiGet<T>(path: string) {
  return apiRequest<T>(path);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  body: unknown,
  requestHeaders?: HeadersInit,
) {
  const headers = new Headers(requestHeaders);
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