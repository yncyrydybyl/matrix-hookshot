# Improvement plan

## Phase 1 -- Test coverage (one PR per feature area)

Each PR adds tests for a specific feature area. The PR description explains what
the tests cover and why that area matters.

### Priority order (by risk and complexity)

| # | Area | Source files | Lines | Current tests | PR status |
|---|------|-------------|-------|---------------|-----------|
| 1 | Bridge core | `Bridge.ts`, `ConnectionManager.ts` | ~3,085 | None | Not started |
| 2 | Setup connection | `Connections/SetupConnection.ts` | ~1,033 | None | Not started |
| 3 | JIRA project connection | `Connections/JiraProject.ts`, `jira/` | ~1,582 | E2E only | Not started |
| 4 | OpenProject connection | `Connections/OpenProjectConnection.ts`, `openproject/` | ~1,722 | E2E only | Not started |
| 5 | GitHub issue connection | `Connections/GithubIssue.ts` | ~519 | None | Not started |
| 6 | GitHub discussion | `Connections/GithubDiscussion.ts`, `GithubDiscussionSpace.ts` | ~540 | None | Not started |
| 7 | GitLab issue connection | `Connections/GitlabIssue.ts` | ~384 | None | Not started |
| 8 | Outbound hooks | `Connections/OutboundHook.ts` | ~375 | None | Not started |
| 9 | Feed connection | `Connections/FeedConnection.ts` | ~368 | None | Not started |
| 10 | Figma connection | `Connections/FigmaFileConnection.ts`, `figma/` | ~480 | None | Not started |
| 11 | Hound connection | `Connections/HoundConnection.ts` | ~314 | None | Not started |
| 12 | Notification system | `NotificationsProcessor.ts`, `notifications/` | ~752 | None | Not started |
| 13 | Storage providers | `stores/` | ~741 | None | Not started |
| 14 | Message queue | `messageQueue/` | ~264 | None | Not started |
| 15 | Comment processor | `CommentProcessor.ts` | ~208 | None | Not started |
| 16 | Existing tests deepening | `GithubRepo`, `GitlabRepo`, `GenericHook` | ~4,217 | Partial | Not started |

### PR template for test coverage PRs

Each PR should include in its description:

```markdown
## What these tests cover
- [list of behaviors tested]

## Why this area needs tests
- [risk assessment, complexity notes, dependency on external services]

## What is NOT covered and why
- [deliberate exclusions, e.g. "OAuth flow requires live credentials"]
```

---

## Phase 2 -- Test tooling improvement (single PR)

One PR that improves the overall test infrastructure. See [TEST_IMPROVEMENT.md](TEST_IMPROVEMENT.md) for details.

Goals:
- **Fast**: Unit tests complete in seconds, not minutes
- **Clear failures**: Test output tells you exactly what broke and why
- **Behavior-driven**: Tests describe what the system does, not how it's wired
- **Stays out of the way**: No flaky tests, no unnecessary setup, fast feedback loop

---

## Phase 3 -- Rust migration (series of individually-mergeable PRs)

Each PR replaces one TypeScript module with Rust via NAPI. PRs are independent
and can be merged in any order. See [RUST_MIGRATION.md](RUST_MIGRATION.md) for details.

| # | Module | Rationale | PR status |
|---|--------|-----------|-----------|
| 1 | Webhook payload validation | CPU-bound JSON schema validation | Not started |
| 2 | Configuration parsing & validation | Complex validation logic, runs once at startup | Not started |
| 3 | Generic webhook transformation | QuickJS can be replaced with a Rust sandbox | Not started |
| 4 | GitLab client | HTTP + parsing, self-contained | Not started |
| 5 | JIRA client | HTTP + parsing, self-contained | Not started |
| 6 | Notification filtering | Pure logic, no Matrix dependencies | Not started |
| 7 | Connection state machines | Core logic, benefits from Rust's type system | Not started |
| 8 | Storage providers | Memory/Redis abstraction, benefits from ownership model | Not started |
| 9 | Message queue | Concurrency-critical, benefits from Rust's safety | Not started |
