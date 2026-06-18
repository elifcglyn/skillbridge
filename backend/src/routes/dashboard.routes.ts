import { Router } from "express";
import {
  getDashboardController,
  searchDashboardController,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/", getDashboardController);
router.get("/search", searchDashboardController);

export default router;
