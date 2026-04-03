---
title: Roadmap
description: What's planned, what's in progress, and what's not on the roadmap
audience: [evaluator, contributor, architect]
---

# Roadmap

Based on open issues and PRs on [matrix-org/matrix-hookshot](https://github.com/matrix-org/matrix-hookshot/issues) as of April 2026.

## Active work

| Area | Issue/PR | Status |
|---|---|---|
| Generic webhook `waitForComplete` fix | [#1229](https://github.com/matrix-org/matrix-hookshot/issues/1229), [#1228](https://github.com/matrix-org/matrix-hookshot/issues/1228) | PRs exist, S-Major defect |
| GitHub Actions hardening (Zizmor) | [#1244](https://github.com/matrix-org/matrix-hookshot/issues/1244) | PR open |
| Redis documentation fix | [#1246](https://github.com/matrix-org/matrix-hookshot/issues/1246) | PR open |
| Helm securityContext fix | [#1243](https://github.com/matrix-org/matrix-hookshot/issues/1243) | PR open |

## Known defects

| Issue | Severity | Description |
|---|---|---|
| [#1228](https://github.com/matrix-org/matrix-hookshot/issues/1228) | Major | Static webhook with transformationFunction fails (late QuickJS init) |
| [#1227](https://github.com/matrix-org/matrix-hookshot/issues/1227) | Minor | GitHub personal notifications doubleposting |
| [#1137](https://github.com/matrix-org/matrix-hookshot/issues/1137) | Defect | "This endpoint can only be called by appservices" on startup with encryption |
| [#1100](https://github.com/matrix-org/matrix-hookshot/issues/1100) | Defect | Docker CI workflow tries to login on PRs (not just releases) |
| [#1093](https://github.com/matrix-org/matrix-hookshot/issues/1093) | Defect | E2EE integration tests failing consistently |
| [#1087](https://github.com/matrix-org/matrix-hookshot/issues/1087) | Major | Network failures during startup cause missed [connections](../architecture/connections.md) |

## Feature requests

| Issue | Description | Complexity |
|---|---|---|
| [#1226](https://github.com/matrix-org/matrix-hookshot/issues/1226) | Edit previously sent webhook messages (PATCH support) | Medium |
| [#1217](https://github.com/matrix-org/matrix-hookshot/issues/1217) | URL preview handling (MSC4417) | Medium |
| [#1151](https://github.com/matrix-org/matrix-hookshot/issues/1151) | Update Matrix messages when RSS content changes | Medium |
| [#1107](https://github.com/matrix-org/matrix-hookshot/issues/1107) | AI-assisted natural language control for integrations | Large |
| [#1106](https://github.com/matrix-org/matrix-hookshot/issues/1106) | Support `relates_to` in GenericHook | Small |
| [#1099](https://github.com/matrix-org/matrix-hookshot/issues/1099) | Sort [feed](../integrations/feeds.md) entries by publication date | Small |
| [#1088](https://github.com/matrix-org/matrix-hookshot/issues/1088) | Retry failed [connections](../architecture/connections.md) on startup | Medium |
| [#1084](https://github.com/matrix-org/matrix-hookshot/issues/1084) | Support MSC4190 (MAS appservice login) | Medium |
| [#1082](https://github.com/matrix-org/matrix-hookshot/issues/1082) | Crash if homeserver refuses AS token | Small |
| [#1067](https://github.com/matrix-org/matrix-hookshot/issues/1067) | Create new users for Matterbridge bridging | Medium |
| [#304](https://github.com/matrix-org/matrix-hookshot/issues/304) | Gitea/Forgejo/Codeberg API support | Large |

## Technical debt

| Issue | Description |
|---|---|
| [#1211](https://github.com/matrix-org/matrix-hookshot/issues/1211) | Deprecated ProvisioningApi still used by matrix-appservice-bridge |
| [#1206](https://github.com/matrix-org/matrix-hookshot/issues/1206) | Integration tests diverge from real-world usage |
| [#1204](https://github.com/matrix-org/matrix-hookshot/issues/1204) | Replace TypeScript decorators with a different solution |
| [#1150](https://github.com/matrix-org/matrix-hookshot/issues/1150) | Convert E2EE tests to Vitest contexts |
| [#1103](https://github.com/matrix-org/matrix-hookshot/issues/1103) | Replace Helm chart with ESS-helm instructions |

## Dependency updates pending

Major version bumps tracked via Renovate ([#1123 Dependency Dashboard](https://github.com/matrix-org/matrix-hookshot/issues/1123)):

| Dependency | Update | Issue |
|---|---|---|
| Rust crate `ruma` | → 0.14 | [#1134](https://github.com/matrix-org/matrix-hookshot/issues/1134) |
| Rust crate `napi` | → v3 | [#1127](https://github.com/matrix-org/matrix-hookshot/issues/1127), [#1128](https://github.com/matrix-org/matrix-hookshot/issues/1128) |
| Rust crate `rand` | → 0.9 | [#1132](https://github.com/matrix-org/matrix-hookshot/issues/1132) |
| testcontainers-node | → v11 | [#1129](https://github.com/matrix-org/matrix-hookshot/issues/1129) |
| @sentry/node | → v10 | [#1199](https://github.com/matrix-org/matrix-hookshot/issues/1199) |

## Not planned (as far as we know)

- Full conversation sync between Matrix and external services
- Bidirectional issue synchronization
- Gitea/Forgejo native support ([#304](https://github.com/matrix-org/matrix-hookshot/issues/304) — requested but no active work)
- Generic bot framework features

## Related

**Project:** [Ecosystem](ecosystem.md) · [Limitations](limitations.md)

**Architecture:** [Connections](../architecture/connections.md) · [Failure and Recovery](../architecture/failure-and-recovery.md)

**Troubleshooting:** [Common Errors](../troubleshooting/common-errors.md)
