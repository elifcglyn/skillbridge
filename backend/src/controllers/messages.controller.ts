import type { Request, Response } from "express";
import { getMessagesHistory } from "../services/messages.service.js";

export async function getMessagesHistoryController(
  request: Request,
  response: Response,
) {
  try {
    const userId = String(request.query.userId ?? "").trim();
    const otherUserId = String(request.query.otherUserId ?? "").trim();
    const limitQuery = request.query.limit;

    const limit =
      typeof limitQuery === "string" && limitQuery.trim() !== ""
        ? Number(limitQuery)
        : undefined;

    if (limit !== undefined && Number.isNaN(limit)) {
      return response.status(400).json({
        message: "limit sayısal bir değer olmalıdır.",
      });
    }

    if (!userId || !otherUserId) {
      return response.status(400).json({
        message: "userId ve otherUserId query parametreleri zorunludur.",
      });
    }

    const messages = await getMessagesHistory({
      userId,
      otherUserId,
      limit,
    });

    return response.json({
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Messages history endpoint error:", error);

    return response.status(500).json({
      message: "Mesaj geçmişi alınırken bir hata oluştu.",
    });
  }
}