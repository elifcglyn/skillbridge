import { Router } from "express";
import {
  getMessagesHistoryController,
  markMessagesAsReadController,
} from "../controllers/messages.controller.js";

const router = Router();

router.get("/", getMessagesHistoryController);
router.patch("/read", markMessagesAsReadController);

export default router;