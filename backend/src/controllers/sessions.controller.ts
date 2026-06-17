import type { Request, Response } from "express";
import { createSession, listSessions } from "../services/sessions.service.js";

export async function listSessionsController(request: Request, response: Response) {
  try {
    const userId = String(request.query.userId ?? "").trim();

    if (!userId) {
      return response.status(400).json({ message: "userId query parametresi zorunludur." });
    }

    const sessions = await listSessions(userId);
    return response.json({ data: sessions, count: sessions.length });
  } catch (error) {
    console.error("Sessions list endpoint error:", error);
    return response.status(500).json({ message: "Görüşmeler alınırken bir hata oluştu." });
  }
}

export async function createSessionController(request: Request, response: Response) {
  try {
    const mentorId = String(request.body?.mentorId ?? "").trim();
    const learnerId = String(request.body?.learnerId ?? request.body?.studentId ?? "").trim();
    const scheduledAt = String(request.body?.scheduledAt ?? "").trim();
    const scheduledDate = new Date(scheduledAt);

    if (!mentorId || !learnerId || !scheduledAt || Number.isNaN(scheduledDate.getTime())) {
      return response.status(400).json({
        message: "mentorId, learnerId ve geçerli scheduledAt alanları zorunludur.",
      });
    }

    const session = await createSession({
      mentorId,
      learnerId,
      scheduledAt,
      title: request.body?.title,
      skillName: request.body?.skillName,
      durationMinutes: Number(request.body?.durationMinutes ?? 60),
      deliveryType: request.body?.deliveryType,
    });

    return response.status(201).json({ data: session });
  } catch (error) {
    console.error("Session create endpoint error:", error);
    return response.status(500).json({ message: "Görüşme oluşturulurken bir hata oluştu." });
  }
}
