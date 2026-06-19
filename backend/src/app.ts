import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.middleware.js";
import coinsRoutes from "./routes/coins.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
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
    origin: "*", // En sert ve kesin çözüm: Her yerden gelen isteği kabul et!
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api", requireAuth);
app.use("/api/coins", coinsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/sessions", sessionsRoutes);

export default app;
