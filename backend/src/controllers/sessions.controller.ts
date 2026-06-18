import type { Request, Response } from "express";
import { createSession, listSessions } from "../services/sessions.service.js";

export async function listSessionsController(request: Request, response: Response) {
  try {
    const sessions = await listSessions(request.auth.userId);
    return response.json({ data: sessions, count: sessions.length });
  } catch (error) {
    console.error("Sessions list endpoint error:", error);
    return response.status(500).json({ message: "Görüşmeler alınırken bir hata oluştu." });
  }
}

export async function createSessionController(request: Request, response: Response) {
  try {
    const learnerId = String(request.body?.learnerId ?? request.body?.studentId ?? "").trim();
    const scheduledAt = String(request.body?.scheduledAt ?? "").trim();
    const scheduledDate = new Date(scheduledAt);

    if (!learnerId || !scheduledAt || Number.isNaN(scheduledDate.getTime())) {
      return response.status(400).json({
        message: "learnerId ve geçerli scheduledAt alanları zorunludur.",
      });
    }

    if (learnerId === request.auth.userId) {
      return response.status(400).json({ message: "Kendinizle görüşme oluşturamazsınız." });
    }

    const session = await createSession({
      mentorId: request.auth.userId,
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
