import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.middleware.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import healthRoutes from "./routes/health.routes.js";
import matchesRoutes from "./routes/matches.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import profilesRoutes from "./routes/profiles.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";

const corsOrigin = process.env.CORS_ORIGIN;

export const app = express();

app.use(
  cors({
    origin: corsOrigin 
      ? corsOrigin.split(",").map((origin) => origin.trim()) 
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true, // Kimlik doğrulama (cookie/token) geçişine izin veren kritik ayar
  }),
);

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api", requireAuth);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/sessions", sessionsRoutes);

export default app;