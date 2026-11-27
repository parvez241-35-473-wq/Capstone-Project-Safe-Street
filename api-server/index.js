import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });
dotenv.config(); // fallback: local .env if present

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚦 SafeStreet API server running on http://localhost:${PORT}`);
});
