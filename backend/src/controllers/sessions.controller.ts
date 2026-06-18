import type { Request, Response } from "express";
import {
  createSession,
  getSession,
  listSessions,
  SessionActionError,
  updateSession,
  type SessionAction,
} from "../services/sessions.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set<SessionAction>([
  "accept",
  "decline",
  "cancel",
  "reschedule",
  "complete",
]);
const STATUSES = new Set([
  "pending",
  "scheduled",
  "declined",
  "cancelled",
  "completed",
]);
const SCOPES = new Set(["invitations", "upcoming", "history"]);
const ROLES = new Set(["creator", "invitee"]);

function parseDateQuery(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function actionErrorResponse(error: SessionActionError, response: Response) {
  if (error.code === "NOT_FOUND") {
    return response.status(404).json({ message: error.message });
  }
  if (error.code === "FORBIDDEN") {
    return response.status(403).json({ message: error.message });
  }
  if (
    error.code === "TERMINAL_STATUS" ||
    error.code === "SESSION_CONFLICT" ||
    error.code === "CONCURRENT_UPDATE"
  ) {
    return response.status(409).json({ message: error.message });
  }
  return response.status(400).json({ message: error.message });
}

export async function listSessionsController(request: Request, response: Response) {
  try {
    const from = parseDateQuery(request.query.from);
    const to = parseDateQuery(request.query.to);

    if (from === null || to === null) {
      return response.status(400).json({ message: "from ve to geçerli tarih olmalıdır." });
    }
    if (from && to && new Date(from).getTime() >= new Date(to).getTime()) {
      return response.status(400).json({ message: "from tarihi to tarihinden önce olmalıdır." });
    }

    const statuses =
      typeof request.query.status === "string"
        ? request.query.status.split(",").map((status) => status.trim()).filter(Boolean)
        : undefined;
    const scope =
      typeof request.query.scope === "string"
        ? request.query.scope.trim().toLowerCase()
        : undefined;
    const role =
      typeof request.query.role === "string"
        ? request.query.role.trim().toLowerCase()
        : undefined;
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : undefined;
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);

    if (statuses?.some((status) => !STATUSES.has(status.toLowerCase()))) {
      return response.status(400).json({ message: "Geçersiz görüşme durumu." });
    }
    if (scope && !SCOPES.has(scope)) {
      return response.status(400).json({ message: "Geçersiz görüşme kapsamı." });
    }
    if (role && !ROLES.has(role)) {
      return response.status(400).json({ message: "Geçersiz görüşme rolü." });
    }
    if (query && query.length > 100) {
      return response.status(400).json({ message: "Arama metni en fazla 100 karakter olabilir." });
    }
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return response.status(400).json({ message: "page ve limit değerleri geçersiz." });
    }

    const result = await listSessions({
      userId: request.auth.userId,
      from,
      to,
      statuses,
      scope: scope as "invitations" | "upcoming" | "history" | undefined,
      query,
      role: role as "creator" | "invitee" | undefined,
      page,
      limit,
    });
    return response.json(result);
  } catch (error) {
    console.error("Sessions list endpoint error:", error);
    return response.status(500).json({ message: "Görüşmeler alınırken bir hata oluştu." });
  }
}

export async function createSessionController(request: Request, response: Response) {
  try {
    const learnerId = String(request.body?.learnerId ?? request.body?.studentId ?? "").trim();
    const matchId = String(request.body?.matchId ?? "").trim();
    const scheduledAt = String(request.body?.scheduledAt ?? "").trim();

    if (!UUID_PATTERN.test(learnerId) || !UUID_PATTERN.test(matchId)) {
      return response.status(400).json({ message: "Geçerli matchId ve learnerId zorunludur." });
    }
    if (learnerId === request.auth.userId) {
      return response.status(400).json({ message: "Kendinizle görüşme oluşturamazsınız." });
    }

    const session = await createSession({
      mentorId: request.auth.userId,
      learnerId,
      matchId,
      scheduledAt,
      title: request.body?.title,
      skillName: request.body?.skillName,
      durationMinutes: Number(request.body?.durationMinutes ?? 60),
    });

    return response.status(201).json({ data: session });
  } catch (error) {
    if (error instanceof SessionActionError) {
      return actionErrorResponse(error, response);
    }
    console.error("Session create endpoint error:", error);
    return response.status(500).json({ message: "Görüşme oluşturulurken bir hata oluştu." });
  }
}

export async function getSessionController(request: Request, response: Response) {
  try {
    const sessionId = String(request.params.id ?? "").trim();
    if (!UUID_PATTERN.test(sessionId)) {
      return response.status(400).json({ message: "Geçerli görüşme kimliği gereklidir." });
    }

    const session = await getSession(request.auth.userId, sessionId);
    return response.json({ data: session });
  } catch (error) {
    if (error instanceof SessionActionError) {
      return actionErrorResponse(error, response);
    }
    console.error("Session detail endpoint error:", error);
    return response.status(500).json({ message: "Görüşme alınırken bir hata oluştu." });
  }
}

export async function updateSessionController(request: Request, response: Response) {
  try {
    const sessionId = String(request.params.id ?? "").trim();
    const action = String(request.body?.action ?? "").trim() as SessionAction;

    if (!UUID_PATTERN.test(sessionId)) {
      return response.status(400).json({ message: "Geçerli görüşme kimliği gereklidir." });
    }
    if (!ACTIONS.has(action)) {
      return response.status(400).json({ message: "Geçerli bir görüşme aksiyonu gereklidir." });
    }

    const session = await updateSession({
      userId: request.auth.userId,
      sessionId,
      action,
      scheduledAt: request.body?.scheduledAt,
      durationMinutes:
        request.body?.durationMinutes === undefined
          ? undefined
          : Number(request.body.durationMinutes),
    });

    return response.json({ data: session });
  } catch (error) {
    if (error instanceof SessionActionError) {
      return actionErrorResponse(error, response);
    }
    console.error("Session update endpoint error:", error);
    return response.status(500).json({ message: "Görüşme güncellenirken bir hata oluştu." });
  }
}
