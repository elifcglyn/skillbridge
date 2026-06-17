import cors from "cors";
import express from "express";
import dashboardRoutes from "./routes/dashboard.routes.js";
import healthRoutes from "./routes/health.routes.js";
import matchesRoutes from "./routes/matches.routes.js";
import profilesRoutes from "./routes/profiles.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";

const corsOrigin = process.env.CORS_ORIGIN;

export const app = express();

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((origin) => origin.trim()) : true,
  }),
);

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/sessions", sessionsRoutes);

export default app;
