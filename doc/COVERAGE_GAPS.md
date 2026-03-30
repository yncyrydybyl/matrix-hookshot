# Test coverage gaps

Analysis as of 2026-03-30.

## Summary

- **~27,400 lines** of source code in `src/`
- **~3,675 lines** of unit tests in `tests/` (Mocha)
- **~2,917 lines** of E2E tests in `spec/` (Vitest)
- **~24% of source code** has direct unit test coverage
- **3 of 19 connection types** have unit tests

## Test infrastructure

| Component | Tool | Location |
|-----------|------|----------|
| Unit tests | Mocha + Chai | `tests/` |
| E2E tests | Vitest + Testcontainers | `spec/` |
| Coverage | NYC | via `yarn test:cover` |
| Mocks | IntentMock, AppserviceMock | `tests/utils/` |

No coverage thresholds are configured. NYC runs with defaults.

## Connection types (critical gap)

Only 3 of 19 connection types have unit tests:

| Connection | Lines | Has unit tests | Has E2E tests |
|------------|-------|----------------|---------------|
| GenericHook | 889 | Yes (624 lines) | Yes |
| GithubRepo | 2,021 | Yes (256 lines, ~12%) | Yes |
| GitlabRepo | 1,307 | Yes (403 lines, ~31%) | Yes |
| SetupConnection | 1,033 | No | Partial |
| OpenProjectConnection | 922 | No | Yes |
| JiraProject | 782 | No | Yes |
| GithubIssue | 519 | No | Yes |
| GitlabIssue | 384 | No | Yes |
| OutboundHook | 375 | No | No |
| FeedConnection | 368 | No | No |
| HoundConnection | 314 | No | No |
| GithubDiscussion | 290 | No | No |
| FigmaFileConnection | 260 | No | No |
| GithubDiscussionSpace | 250 | No | No |
| GithubUserSpace | 243 | No | No |
| GithubProject | 171 | No | No |
| CommandConnection | small | No | No |
| BaseConnection | interface | N/A | N/A |

## Core modules (critical gap)

| Module | Lines | Test status |
|--------|-------|-------------|
| Bridge.ts | 2,161 | **No tests** (highest risk) |
| ConnectionManager.ts | 924 | **No tests** |
| AdminRoom.ts | 854 | 48-line test (insufficient) |
| FeedReader.ts | 402 | 322-line test (good) |
| NotificationsProcessor.ts | 338 | **No tests** |
| BotCommands.ts | 302 | 412-line test (good) |
| Metrics.ts | 219 | **No tests** |
| CommentProcessor.ts | 208 | **No tests** |
| Webhooks.ts | 166 | E2E only |
| FormatUtil.ts | 143 | 158-line test (good) |
| MatrixSender.ts | 139 | **No tests** |
| ListenerService.ts | 141 | **No tests** |

## Entire subsystems without tests

| Subsystem | Lines | Files | Risk |
|-----------|-------|-------|------|
| stores/ (Redis, Memory) | 741 | 3 | Data loss on regressions |
| notifications/ | 414 | 4 | Missed notifications |
| managers/ | 344 | 1 | Bot user lifecycle bugs |
| messageQueue/ | 264 | 5 | Message delivery failures |
| figma/ | 220 | 3 | Silent integration breakage |
| hound/ | 178 | 1 | Silent integration breakage |

## Mocks and test utilities

Available:
- `IntentMock` -- mocks Matrix Intent (send messages, state events)
- `AppserviceMock` -- mocks the appservice registration
- E2E infrastructure with real Synapse via Testcontainers

Missing:
- No mocks for external API clients (GitHub, GitLab, JIRA, etc.)
- No mock for Redis/storage layer
- No mock for message queue
- No test factories for creating connection instances with defaults
- No snapshot testing for formatted messages
