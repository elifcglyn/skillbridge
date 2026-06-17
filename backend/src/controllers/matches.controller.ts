import type { Request, Response } from "express";
import { getAiPicks } from "../services/matches.service.js";

export async function getAiPicksController(request: Request, response: Response) {
  try {
    const userId = String(request.query.userId ?? "").trim();
    const limitQuery = request.query.limit;

    if (!userId) {
      return response.status(400).json({
        message: "userId query parametresi zorunludur.",
      });
    }

    const limit =
      typeof limitQuery === "string" && limitQuery.trim() !== ""
        ? Number(limitQuery)
        : undefined;

    if (limit !== undefined && Number.isNaN(limit)) {
      return response.status(400).json({
        message: "limit sayısal bir değer olmalıdır.",
      });
    }

    const aiPicks = await getAiPicks({ userId, limit });

    return response.json({
      data: aiPicks,
      count: aiPicks.length,
    });
  } catch (error) {
    console.error("AI Picks endpoint error:", error);

    return response.status(500).json({
      message: "AI Picks listesi alınırken bir hata oluştu.",
    });
  }
}