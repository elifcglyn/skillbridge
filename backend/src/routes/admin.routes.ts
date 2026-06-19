import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAdmin);

router.get("/access", (request, response) => {
  response.json({
    data: {
      authorized: true,
      userId: request.auth.userId,
      role: request.auth.role,
    },
  });
});

export default router;
