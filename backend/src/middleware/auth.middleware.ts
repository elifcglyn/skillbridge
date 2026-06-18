import type { NextFunction, Request, Response } from "express";

type SupabaseUserResponse = {
  id?: unknown;
  email?: unknown;
};

function getBearerToken(request: Request) {
  const authorization = request.header("authorization")?.trim();
  if (!authorization) return null;

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return response.status(401).json({ message: "Geçerli bir oturum token'ı gereklidir." });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("SUPABASE_URL and SUPABASE_ANON_KEY are required for API authentication.");
    return response.status(500).json({ message: "API kimlik doğrulaması yapılandırılmamış." });
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (!authResponse.ok) {
      return response.status(401).json({ message: "Oturum geçersiz veya süresi dolmuş." });
    }

    const user = await authResponse.json() as SupabaseUserResponse;
    const userId = typeof user.id === "string" ? user.id.trim() : "";

    if (!userId) {
      return response.status(401).json({ message: "Oturum kullanıcısı doğrulanamadı." });
    }

    request.auth = {
      userId,
      email: typeof user.email === "string" ? user.email : null,
    };

    return next();
  } catch (error) {
    console.error("Supabase auth verification error:", error);
    return response.status(503).json({ message: "Kimlik doğrulama servisine ulaşılamadı." });
  }
}
