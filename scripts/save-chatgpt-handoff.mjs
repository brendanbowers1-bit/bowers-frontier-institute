import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const sourcePath = "CHATGPT_HANDOFF.md";
const destinationPath = join(homedir(), "Desktop", "CHATGPT_HANDOFF.md");

const handoff = await readFile(sourcePath, "utf8");
await mkdir(dirname(destinationPath), { recursive: true });
await writeFile(destinationPath, handoff);

console.log(`Saved ChatGPT handoff to ${destinationPath}`);
