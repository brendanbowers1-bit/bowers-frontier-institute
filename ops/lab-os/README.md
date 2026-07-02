# BFI Lab Operating System

This scaffold defines how all BFI labs should separate code, heavy data, private data, reports, and cloud-agent work.

## Operating model

Use three layers:

1. **GitHub = brain**
   - code
   - schemas
   - configs
   - tests
   - docs
   - phase handoff files
   - small sample or synthetic data only

2. **BFI hard drive = local warehouse**
   - raw market data
   - processed datasets
   - SQLite and DuckDB databases
   - private portfolio exports
   - archive files

3. **Object storage = remote warehouse / backup**
   - Backblaze B2, S3, Cloudflare R2, or Google Cloud Storage
   - use after choosing a provider and credentials strategy
   - cloud agents can use this later for heavy data access

Your phone can safely control GitHub/Cursor work. Heavy local data on `/Volumes/BFI` will not be available to cloud agents until it is synced to object storage or exposed by a controlled connector.

## Standard local paths

Code repos:

```text
/Volumes/BFI/01_ACTIVE_PROJECTS/
```

Heavy data:

```text
/Volumes/BFI/DATA/
```

Recommended all-labs layout:

```text
/Volumes/BFI/DATA/
  bfi-ai-lab/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
  bfi-finance-lab/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
  bfi-t1d-lab/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
  bfi-quantum-lab/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
  bfi-data-standards-lab/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
  br3n-creative/
    raw/
    processed/
    private/
    databases/
    artifacts/
    reports/
    archives/
```

## GitHub repo rule

Each lab should have its own private GitHub repo when it contains active code or governed research history:

- `bfi-ai-lab`
- `bfi-finance-lab`
- `bfi-t1d-lab`
- `bfi-quantum-lab`
- `bfi-data-standards-lab`
- `br3n-creative`
- `bowers-frontier-institute` for the public website

Do not commit heavy data or private exports to GitHub. Use `.gitignore` rules from `gitignore-template.txt`.

## Research governance defaults

All labs should default to:

- reproducible runs
- timestamped artifacts
- source metadata
- no secrets in git
- no private data in git
- sample or synthetic data for cloud tests
- explicit evidence ratings for claims
- phase handoffs for governed research work

Finance-specific defaults:

- `research_only = true`
- no live trading
- no automatic execution
- no investment advice claims
- SQLite pilot DB authoritative unless validated against a warehouse

## Local setup

From this repo, run on the Mac that has `/Volumes/BFI` mounted:

```bash
BFI_DATA_ROOT=/Volumes/BFI/DATA node scripts/create-lab-storage-layout.mjs
```

Dry run:

```bash
BFI_DATA_ROOT=/Volumes/BFI/DATA node scripts/create-lab-storage-layout.mjs --dry-run
```

This only creates directories and starter README files. It does not move data.

## Cloud setup status

No cloud object-storage provider is provisioned by this repo yet. Stripe Projects was not available in the current cloud agent environment because the Stripe CLI was not installed.

Recommended provider order:

1. Backblaze B2 or Cloudflare R2 for low-cost object storage.
2. AWS S3 if you want the standard institutional option.
3. Google Cloud Storage if the rest of your stack moves to Google Cloud.

Before provisioning, decide:

- provider
- bucket names
- retention policy
- encryption settings
- credentials strategy
- whether Cursor agents should receive read-only or read/write access
