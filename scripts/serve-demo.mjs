import { createApiServer } from "../src/api.mjs";

const host = process.env.BFI_API_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.BFI_API_PORT ?? "8787", 10);

if (host !== "127.0.0.1") {
  throw new Error("The demo API binds to 127.0.0.1 unless explicitly reviewed.");
}

const server = createApiServer();
server.listen(port, host, () => {
  console.log(`BFI read-only demo API listening at http://${host}:${port}/api/v1/meta`);
  console.log("Research-only, non-live, non-transactional; no request bodies are logged.");
});
