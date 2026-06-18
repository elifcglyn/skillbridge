import { Router } from "express";
import {
  getAiPicksController,
  listSelectedMatchesController,
  selectMatchController,
} from "../controllers/matches.controller.js";

const router = Router();

router.get("/ai-picks", getAiPicksController);
router.get("/selected", listSelectedMatchesController);
router.post("/selection", selectMatchController);

export default router;
