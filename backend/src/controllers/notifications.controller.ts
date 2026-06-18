import type { Request, Response } from "express";
import {
  getNotificationAction,
  getNotificationById,
  NotificationActionError,
} from "../services/notifications.service.js";
import {
  SessionActionError,
  updateSession,
} from "../services/sessions.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function actionErrorResponse(
  error: NotificationActionError | SessionActionError,
  response: Response,
) {
  if (error.code === "NOT_FOUND") {
    return response.status(404).json({ message: error.message });
  }
  if (error.code === "FORBIDDEN") {
    return response.status(403).json({ message: error.message });
  }
  if (error.code === "TERMINAL_STATUS") {
    return response.status(409).json({ message: error.message });
  }
  return response.status(400).json({ message: error.message });
}

export async function performNotificationActionController(
  request: Request,
  response: Response,
) {
  try {
    const notificationId = String(request.params.id ?? "").trim();
    const actionStatus = String(request.body?.actionStatus ?? "").trim();

    if (!UUID_PATTERN.test(notificationId)) {
      return response
        .status(400)
        .json({ message: "Geçerli bir bildirim kimliği gereklidir." });
    }
    if (actionStatus !== "accepted" && actionStatus !== "declined") {
      return response
        .status(400)
        .json({ message: "Bildirim aksiyonu accepted veya declined olmalıdır." });
    }

    const action = await getNotificationAction(
      notificationId,
      request.auth.userId,
      actionStatus,
    );
    const session = await updateSession({
      userId: request.auth.userId,
      sessionId: action.sessionId,
      action: action.sessionAction,
    });
    const notification = await getNotificationById(
      notificationId,
      request.auth.userId,
    );

    return response.json({ data: notification, session });
  } catch (error) {
    if (
      error instanceof NotificationActionError ||
      error instanceof SessionActionError
    ) {
      return actionErrorResponse(error, response);
    }

    console.error("Notification action endpoint error:", error);
    return response
      .status(500)
      .json({ message: "Bildirim işlemi tamamlanırken bir hata oluştu." });
  }
}
