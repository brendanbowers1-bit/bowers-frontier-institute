# Cloud storage plan for BFI labs

GitHub should hold lab code and governance history. Heavy datasets should live outside git.

## Recommended rollout

### Stage 1 - local only

Use:

```text
/Volumes/BFI/DATA/
```

This is the cheapest and safest first warehouse.

### Stage 2 - object storage backup

Choose one:

- Backblaze B2: low cost, good backup target
- Cloudflare R2: useful when egress costs matter
- AWS S3: most standard institutional option
- Google Cloud Storage: good if the broader stack uses Google Cloud

Suggested buckets:

```text
bfi-labs-raw
bfi-labs-processed
bfi-labs-reports
bfi-labs-archives
```

Keep private account exports in a separate restricted bucket only if needed:

```text
bfi-labs-private
```

### Stage 3 - cloud-agent access

Give agents the minimum needed access:

- read-only for raw and processed data by default
- write access only to reports/artifacts when required
- no private-data access unless explicitly needed

## Provider checklist

Before buying or provisioning, confirm:

- storage price
- egress price
- API compatibility
- encryption defaults
- lifecycle/retention controls
- access-key scoping
- audit logging
- whether Cursor agents should get read-only or read/write access

## Current status

No cloud object storage has been provisioned from this repo.

The current cloud agent environment does not have Stripe CLI installed, so Stripe Projects provisioning could not be used here.

## Recommended next provider choice

Start with either:

1. **Backblaze B2** for cheapest simple backup.
2. **Cloudflare R2** if agent workflows will read/write often and egress fees matter.

Use GitHub for repos regardless of which storage provider you choose.
