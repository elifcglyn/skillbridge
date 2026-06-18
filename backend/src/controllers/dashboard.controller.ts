import type { Request, Response } from "express";
import {
  getDashboard,
  searchDashboard,
} from "../services/dashboard.service.js";

export async function getDashboardController(request: Request, response: Response) {
  try {
    const dashboard = await getDashboard(request.auth.userId);
    response.setHeader("cache-control", "private, no-store");
    return response.json({ data: dashboard });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    return response.status(500).json({ message: "Dashboard verileri alınırken bir hata oluştu." });
  }
}

export async function searchDashboardController(
  request: Request,
  response: Response,
) {
  try {
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : "";
    if (query.length < 2 || query.length > 50) {
      return response.status(400).json({
        message: "Arama metni 2 ile 50 karakter arasında olmalıdır.",
      });
    }

    const results = await searchDashboard(request.auth.userId, query);
    response.setHeader("cache-control", "private, no-store");
    return response.json({ data: results, count: results.length });
  } catch (error) {
    console.error("Dashboard search endpoint error:", error);
    return response.status(500).json({
      message: "Dashboard araması yapılırken bir hata oluştu.",
    });
  }
}
