import { Router } from "express";
import { performNotificationActionController } from "../controllers/notifications.controller.js";

const router = Router();

router.post("/:id/action", performNotificationActionController);

export default router;
