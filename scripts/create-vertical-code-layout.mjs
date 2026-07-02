import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const registryPath = join(process.cwd(), "ops", "lab-os", "labs.json");
const dryRun = process.argv.includes("--dry-run");
const codeRoot = process.env.BFI_CODE_ROOT;

const exists = async (path) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const verticalReadme = (vertical) => `# ${vertical.name}

This is the local code workspace for ${vertical.name}.

Heavy data belongs under:

\`\`\`text
${vertical.localDataPath}
\`\`\`

GitHub repos in this vertical:

${(vertical.repos ?? []).map((repo) => `- ${repo.githubRepo} - ${repo.purpose}`).join("\n")}

Rules:

- Commit code, docs, configs, tests, schemas, and small templates.
- Do not commit heavy data, private exports, databases, or secrets.
- Keep each project mapped to this vertical or move it to the correct vertical before adding new work.
`;

const gitignore = `# BFI vertical workspace
.DS_Store
.env
.env.*
!.env.example

data/raw/
data/processed/
data/private/
data/databases/
data/artifacts/
data/archives/

*.sqlite
*.sqlite3
*.db
*.duckdb
*.parquet
*.feather

credentials/
secrets/
*.pem
*.key
service-account*.json
`;

async function writeIfMissing(path, contents) {
  if (await exists(path)) {
    return false;
  }
  await writeFile(path, contents);
  return true;
}

async function main() {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const root = codeRoot ?? registry.defaultCodeRoot;
  const verticals = registry.verticals ?? registry.labs ?? [];
  const planned = [];

  for (const vertical of verticals) {
    const verticalPath = vertical.localCodePath.replace(registry.defaultCodeRoot, root);
    planned.push(verticalPath);

    if (!dryRun) {
      await mkdir(verticalPath, { recursive: true });
      await writeIfMissing(join(verticalPath, "README.md"), verticalReadme(vertical));
      await writeIfMissing(join(verticalPath, ".gitignore"), gitignore);
      await writeIfMissing(join(verticalPath, ".env.example"), `BFI_VERTICAL_ID=${vertical.id}\nBFI_VERTICAL_DATA=${vertical.localDataPath}\n`);
    }
  }

  if (dryRun) {
    console.log("Dry run. Would create code workspaces:");
  } else {
    console.log("Created or confirmed BFI vertical code workspaces:");
  }

  for (const target of planned) {
    console.log(`- ${target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
