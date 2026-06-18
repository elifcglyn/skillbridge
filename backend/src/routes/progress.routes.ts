import { Router } from "express";
import { getProgressController } from "../controllers/progress.controller.js";

const router = Router();

router.get("/", getProgressController);

export default router;
