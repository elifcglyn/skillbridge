import { Router } from "express";
import {
  createSessionController,
  listSessionsController,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/", listSessionsController);
router.post("/", createSessionController);

export default router;
