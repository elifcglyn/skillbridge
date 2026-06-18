import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

dotenv.config({ quiet: true });

if (
  process.env.NODE_ENV !== "production"
  && (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
) {
  const backendRoot = fileURLToPath(new URL("../..", import.meta.url));
  const frontendEnvPath = path.resolve(backendRoot, "../frontend/.env.local");
  const frontendEnv = dotenv.config({ path: frontendEnvPath, quiet: true }).parsed;

  process.env.SUPABASE_URL ||= frontendEnv?.VITE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY ||= frontendEnv?.VITE_SUPABASE_ANON_KEY;
}
