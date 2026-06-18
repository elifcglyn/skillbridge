import type { Request, Response } from "express";
import {
  createFeedback,
  FeedbackActionError,
  getFeedbackOverview,
} from "../services/feedback.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function feedbackErrorResponse(error: FeedbackActionError, response: Response) {
  if (error.code === "NOT_FOUND") {
    return response.status(404).json({ message: error.message });
  }
  if (error.code === "FORBIDDEN") {
    return response.status(403).json({ message: error.message });
  }
  if (
    error.code === "SESSION_NOT_COMPLETED"
    || error.code === "ALREADY_REVIEWED"
  ) {
    return response.status(409).json({ message: error.message });
  }
  return response.status(400).json({ message: error.message });
}

export async function getFeedbackController(
  request: Request,
  response: Response,
) {
  try {
    const overview = await getFeedbackOverview(request.auth.userId);
    response.setHeader("cache-control", "private, no-store");
    return response.json({ data: overview });
  } catch (error) {
    console.error("Feedback overview endpoint error:", error);
    return response.status(500).json({
      message: "Geri bildirim bilgileri alınırken bir hata oluştu.",
    });
  }
}

export async function createFeedbackController(
  request: Request,
  response: Response,
) {
  try {
    const sessionId = String(request.body?.sessionId ?? "").trim();
    const rating = Number(request.body?.rating);
    const comment = String(request.body?.comment ?? "");

    if (!UUID_PATTERN.test(sessionId)) {
      return response.status(400).json({
        message: "Geçerli bir görüşme kimliği zorunludur.",
      });
    }

    const feedback = await createFeedback({
      userId: request.auth.userId,
      sessionId,
      rating,
      comment,
    });
    return response.status(201).json({ data: feedback });
  } catch (error) {
    if (error instanceof FeedbackActionError) {
      return feedbackErrorResponse(error, response);
    }
    console.error("Feedback create endpoint error:", error);
    return response.status(500).json({
      message: "Değerlendirme gönderilirken bir hata oluştu.",
    });
  }
}
