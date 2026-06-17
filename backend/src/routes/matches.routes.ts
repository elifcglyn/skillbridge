import { Router } from "express";
import { getAiPicksController } from "../controllers/matches.controller.js";

const router = Router();

router.get("/ai-picks", getAiPicksController);

export default router;