import { Router } from "express";
import {
  createSessionController,
  listSessionsController,
  updateSessionController,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/", listSessionsController);
router.post("/", createSessionController);
router.patch("/:id", updateSessionController);

export default router;
