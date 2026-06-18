import { Router } from "express";
import {
  createFeedbackController,
  getFeedbackController,
} from "../controllers/feedback.controller.js";

const router = Router();

router.get("/", getFeedbackController);
router.post("/", createFeedbackController);

export default router;
