import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const registryPath = join(process.cwd(), "ops", "lab-os", "labs.json");
const dryRun = process.argv.includes("--dry-run");
const dataRoot = process.env.BFI_DATA_ROOT;

const readme = (lab) => `# ${lab.name} data warehouse

This folder is the local heavy-data warehouse for ${lab.name}.

Do not commit private or heavy files to GitHub. Keep code, schemas, tests, docs, and small templates in the lab repo.

Expected folders:

- raw/ - source-shaped vendor/public payloads
- processed/ - normalized research tables
- private/ - account exports, sensitive research inputs, or restricted data
- databases/ - SQLite, DuckDB, or other local database files
- artifacts/ - model artifacts and generated outputs
- reports/ - generated reports
- archives/ - dated compressed backups or frozen datasets

If this data needs cloud-agent access, sync selected non-private folders to object storage after provider credentials and permissions are configured.
`;

async function main() {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const root = dataRoot ?? registry.defaultDataRoot;
  const created = [];

  for (const lab of registry.labs) {
    const labPath = lab.localDataPath.replace(registry.defaultDataRoot, root);
    for (const folder of lab.dataClasses) {
      const target = join(labPath, folder);
      created.push(target);
      if (!dryRun) {
        await mkdir(target, { recursive: true });
      }
    }

    if (!dryRun) {
      await writeFile(join(labPath, "README.md"), readme(lab));
    }
  }

  if (dryRun) {
    console.log("Dry run. Would create:");
  } else {
    console.log("Created or confirmed BFI lab storage folders:");
  }

  for (const target of created) {
    console.log(`- ${target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
