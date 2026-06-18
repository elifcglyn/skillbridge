import type { Request, Response } from "express";
import { getProgress } from "../services/progress.service.js";

export async function getProgressController(
  request: Request,
  response: Response,
) {
  try {
    const year = Number(
      request.query.year ?? new Date().getFullYear(),
    );
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return response.status(400).json({
        message: "year 2020 ile 2100 arasında geçerli bir yıl olmalıdır.",
      });
    }

    const progress = await getProgress(request.auth.userId, year);
    response.setHeader("cache-control", "private, no-store");
    return response.json({ data: progress });
  } catch (error) {
    console.error("Progress endpoint error:", error);
    return response.status(500).json({
      message: "Gelişim verileri alınırken bir hata oluştu.",
    });
  }
}
