import "dotenv/config";
import { app } from "./app";

const port = parseInt(process.env.PORT ?? "3001", 10);

app.listen(port, () => {
  console.log(`[server] Backend listening on http://localhost:${port}`);
  console.log(`[server] Swagger docs: http://localhost:${port}/api/docs`);
});
