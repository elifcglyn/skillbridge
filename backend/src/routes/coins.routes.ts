import { Router } from "express";
import {
  getCoinsController,
  spendCoinsController,
} from "../controllers/coins.controller.js";

const router = Router();

router.get("/", getCoinsController);
router.post("/spend", spendCoinsController);

export default router;
