import { Router } from "express";
import {
  getProfileController,
  upsertProfileController,
} from "../controllers/profiles.controller.js";

const router = Router();

router.get("/", getProfileController);
router.put("/", upsertProfileController);

export default router;
