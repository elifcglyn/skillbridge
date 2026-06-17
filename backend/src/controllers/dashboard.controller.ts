import type { Request, Response } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(request: Request, response: Response) {
  try {
    const userId = String(request.query.userId ?? "").trim();

    if (!userId) {
      return response.status(400).json({ message: "userId query parametresi zorunludur." });
    }

    const dashboard = await getDashboard(userId);
    return response.json({ data: dashboard });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    return response.status(500).json({ message: "Dashboard verileri alınırken bir hata oluştu." });
  }
}
