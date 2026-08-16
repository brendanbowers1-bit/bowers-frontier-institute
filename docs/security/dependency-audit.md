# Dependency audit

Date: 2026-08-16

## Scope

This audit covers the npm dependency tree for the static React/Vite GitHub Pages
application in this repository. The following commands were run before
remediation:

```bash
npm audit
npm audit --json
npm outdated
npm ls --all
```

The initial audit reported 9 vulnerabilities: 1 low, 2 moderate, 6 high, and 0
critical. No finding was a direct dependency vulnerability. The affected code was
introduced through local build, lint, or CLI tooling chains and was not bundled
into the deployed browser application served by GitHub Pages.

## Vulnerability classification

| Package | Severity | Direct/Transitive | Runtime/Dev | Installed | Fixed In | Dependency Chain | Production Exposure | Resolution |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| @hono/node-server | Moderate | Transitive | Build/tooling only via `shadcn` CLI chain | 1.19.14 | 1.19.17 | `shadcn -> @modelcontextprotocol/sdk -> @hono/node-server` | Not bundled into the static GitHub Pages app. Could execute only if local CLI/server tooling using this chain is invoked. | Updated by non-force `npm audit fix` to 1.19.17. |
| body-parser | Low | Transitive | Build/tooling only via `shadcn` CLI chain | 2.2.2 | 2.3.0 | `shadcn -> @modelcontextprotocol/sdk -> express -> body-parser` | Not bundled into the static GitHub Pages app. Could execute only in local/server tooling contexts. | Updated by non-force `npm audit fix` to 2.3.0. |
| brace-expansion | High | Transitive | Development/lint tooling | 5.0.6 | 5.0.9 | `eslint -> minimatch -> brace-expansion`; also reachable through `shadcn -> ts-morph -> @ts-morph/common -> minimatch -> brace-expansion` | Not bundled into the deployed browser app. Exposure is local CI/developer tooling processing glob patterns. | Updated by non-force `npm audit fix` to 5.0.9. |
| fast-uri | High | Transitive | Build/tooling only via `shadcn` CLI chain | 3.1.2 | 3.1.5 | `shadcn -> @modelcontextprotocol/sdk -> ajv -> fast-uri` and `shadcn -> @modelcontextprotocol/sdk -> ajv-formats -> ajv -> fast-uri` | Not bundled into the static GitHub Pages app. Exposure is CLI/schema validation tooling, not browser runtime. | Updated by non-force `npm audit fix` to 3.1.5. |
| hono | Moderate | Transitive | Build/tooling only via `shadcn` CLI chain | 4.12.28 | 4.13.2 | `shadcn -> @modelcontextprotocol/sdk -> hono`; also `shadcn -> @modelcontextprotocol/sdk -> @hono/node-server -> hono` | Not bundled into the static GitHub Pages app. Could execute only if local CLI/server tooling using this chain is invoked. | Updated by non-force `npm audit fix` to 4.13.2. |
| ip-address | High | Transitive | Build/tooling only via `shadcn` CLI chain | 10.2.0 | 10.5.0 | `shadcn -> @modelcontextprotocol/sdk -> express-rate-limit -> ip-address` | Not bundled into the static GitHub Pages app. Exposure is local/server tooling validation logic, not deployed static runtime. | Updated by non-force `npm audit fix` to 10.5.0. |
| js-yaml | High | Transitive | Build/tooling only via `shadcn` CLI chain | 4.2.0 | 4.3.1 | `shadcn -> cosmiconfig -> js-yaml` | Not bundled into the static GitHub Pages app. Exposure is local config loading if untrusted YAML is processed. | Updated by non-force `npm audit fix` to 4.3.1. |
| nanoid | High | Transitive | Build tooling | 3.3.12 | 3.3.18 | `vite -> postcss -> nanoid`; also `shadcn -> postcss -> nanoid` | Not bundled into the app code as a runtime dependency. Exposure is build/tooling use of PostCSS. | Updated by non-force `npm audit fix` to 3.3.18. |
| postcss | High | Transitive | Build tooling | 8.5.15 | 8.5.26 | `vite -> postcss`; also `shadcn -> postcss` | Not shipped as browser application code. Exposure is build-time processing of CSS/source maps. | Updated by non-force `npm audit fix` to 8.5.26. |

Advisory references from the original audit included:

- `@hono/node-server`: GHSA-frvp-7c67-39w9
- `body-parser`: GHSA-v422-hmwv-36x6
- `brace-expansion`: GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895
- `fast-uri`: GHSA-v2hh-gcrm-f6hx, GHSA-7p8r-x3mc-p8w7, GHSA-4c8g-83qw-93j6
- `hono`: GHSA-8j4g-w8fx-2239, GHSA-f23p-vx2j-j53r, GHSA-79qm-7rj5-m7r9, GHSA-54fx-42gc-7vw4
- `ip-address`: GHSA-mwp4-54f8-5fhr, GHSA-4xrf-jv44-h6hh, GHSA-22jq-vg5j-6vgg
- `js-yaml`: GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj
- `nanoid`: GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8
- `postcss`: GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849

## Remediation summary

Remediation was performed with:

```bash
npm audit fix
```

No `--force` remediation was used. The fix changed only safe transitive
dependency versions and did not require app code migrations. `shadcn` was also
moved from `dependencies` to `devDependencies` because it is CLI/scaffolding
tooling and is not imported by the deployed React application.

Post-remediation audit result:

```bash
npm audit --audit-level=high
# found 0 vulnerabilities
```

## Deferred dependency updates

`npm outdated` still reports newer minor or patch versions for several direct
dependencies. Those updates were intentionally deferred because they were not
required to remediate the security advisories, and broad dependency churn would
increase regression risk without a specific production-security benefit.
