import type { Request, Response } from "express";
import {
  getAiPicks,
  listSelectedMatches,
  selectMatch,
} from "../services/matches.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getAiPicksController(request: Request, response: Response) {
  try {
    const limitQuery = request.query.limit;
    const limit =
      typeof limitQuery === "string" && limitQuery.trim() !== ""
        ? Number(limitQuery)
        : undefined;
    const skillQuery = request.query.skill;
    const skillName =
      typeof skillQuery === "string" ? skillQuery.trim() : undefined;

    if (limit !== undefined && Number.isNaN(limit)) {
      return response.status(400).json({
        message: "limit sayısal bir değer olmalıdır.",
      });
    }

    if (skillName && skillName.length > 100) {
      return response.status(400).json({
        message: "Beceri adı en fazla 100 karakter olabilir.",
      });
    }

    const aiPicks = await getAiPicks({
      userId: request.auth.userId,
      limit,
      skillName,
    });

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

export async function selectMatchController(request: Request, response: Response) {
  try {
    const otherUserId = String(request.body?.otherUserId ?? "").trim();
    const skillName = String(request.body?.skillName ?? "").trim();

    if (!UUID_PATTERN.test(otherUserId) || otherUserId === request.auth.userId) {
      return response.status(400).json({ message: "Geçerli bir eşleşme kullanıcısı gereklidir." });
    }

    if (!skillName || skillName.length > 100) {
      return response.status(400).json({ message: "Geçerli bir beceri adı gereklidir." });
    }

    const match = await selectMatch({
      userId: request.auth.userId,
      otherUserId,
      skillName,
    });

    return response.status(201).json({ data: match });
  } catch (error) {
    if (error instanceof Error && error.message === "MATCH_TARGET_NOT_AVAILABLE") {
      return response.status(404).json({ message: "Eşleşme kullanıcısı artık erişilebilir değil." });
    }

    if (error instanceof Error && error.message === "MATCH_SKILL_NOT_AVAILABLE") {
      return response.status(400).json({
        message: "Seçilen beceri bu kullanıcı tarafından öğretilmiyor.",
      });
    }

    console.error("Match selection endpoint error:", error);
    return response.status(500).json({ message: "Eşleşme kaydedilirken bir hata oluştu." });
  }
}

export async function listSelectedMatchesController(request: Request, response: Response) {
  try {
    const matches = await listSelectedMatches(request.auth.userId);
    return response.json({ data: matches, count: matches.length });
  } catch (error) {
    console.error("Selected matches endpoint error:", error);
    return response.status(500).json({ message: "Seçili eşleşmeler alınırken bir hata oluştu." });
  }
}
