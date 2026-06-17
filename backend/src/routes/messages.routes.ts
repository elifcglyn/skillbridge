import { Router } from "express";
import { getMessagesHistoryController } from "../controllers/messages.controller.js";

const router = Router();

router.get("/", getMessagesHistoryController);

export default router;