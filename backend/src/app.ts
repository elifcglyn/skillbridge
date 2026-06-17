import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health.routes.js";
import matchesRoutes from "./routes/matches.routes.js";

const corsOrigin = process.env.CORS_ORIGIN;

export const app = express();

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((origin) => origin.trim()) : true,
  }),
);

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/matches", matchesRoutes);

export default app;