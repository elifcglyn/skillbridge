import type { Request, Response } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(request: Request, response: Response) {
  try {
    const dashboard = await getDashboard(request.auth.userId);
    return response.json({ data: dashboard });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    return response.status(500).json({ message: "Dashboard verileri alınırken bir hata oluştu." });
  }
}
