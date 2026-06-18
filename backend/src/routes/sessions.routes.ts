import { Router } from "express";
import {
  createSessionController,
  getSessionController,
  listSessionsController,
  updateSessionController,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/", listSessionsController);
router.get("/:id", getSessionController);
router.post("/", createSessionController);
router.patch("/:id", updateSessionController);

export default router;
