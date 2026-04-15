import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "dist");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist/
app.use(express.static(distPath));

// SPA fallback — return index.html for all non-file routes
app.get("*", (req, res) => {
  const indexPath = join(distPath, "index.html");
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found");
  }
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
