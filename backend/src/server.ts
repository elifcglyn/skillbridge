import "./config/env.js";
import { app } from "./app.js";

// Render veya herhangi bir cloud platformu port atadıysa onu kullan,
// atanmadıysa varsayılan 4000'i kullan.
const port = Number(process.env.PORT || 4000);

app.listen(port, "0.0.0.0", () => {
  console.log(`SkillBridge API listening on port ${port}`);
});