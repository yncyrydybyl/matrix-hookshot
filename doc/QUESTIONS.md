# Open questions

Issues discovered during codebase analysis that need decisions before proceeding.

## Architecture

### Q1: Bridge.ts is 2,161 lines with no tests -- refactor or test as-is?

`Bridge.ts` is the largest and most critical file in the codebase. It handles
Matrix event dispatch, connection lifecycle, webhook routing, and room management.

Options:
- **A**: Write tests against the current monolith, then refactor.
- **B**: Refactor into smaller modules first, then test each module.
- **C**: Test the happy paths as-is, refactor incrementally.

Recommendation: **C** -- get basic coverage first, refactor under test safety.

### Q2: ConnectionManager.ts tightly couples connection creation and state management

`ConnectionManager.ts` (924 lines) handles both creating connections from
Matrix state events and managing their lifecycle. These are separate concerns.

Should we split this before adding tests, or test the current shape?

### Q3: Matrix state as primary storage -- is this still the right choice?

The project uses Matrix room state as its primary data store (no external DB).
This means:
- Every config change is a Matrix state event
- Connection state is derived from room state on startup
- No query capability beyond what Matrix provides

Is this a deliberate architectural constraint we want to keep, or should we
consider adding a lightweight database for connection metadata?

## External dependencies

### Q4: Should we deprecate JIRA Server support?

Atlassian ended JIRA Server support in February 2024. The codebase maintains
separate Cloud and On-Prem clients with different OAuth flows (OAuth 2.0 vs
OAuth 1.0 with RSA-SHA1).

Dropping On-Prem would:
- Remove ~400 lines of OAuth 1.0 code
- Simplify the JIRA client to a single implementation
- Remove dependency on legacy `jira-client` package

But some users may still run JIRA Data Center (which is different from Server).

### Q5: Replace figma-js with raw HTTP or official Figma SDK?

`figma-js` v1.16.1-0 is unmaintained and pinned to a pre-release version.
The Figma integration only uses 3 API endpoints.

Options:
- **A**: Replace with raw axios calls (like GitLab/OpenProject)
- **B**: Use Figma's official `@figma/rest-api-spec`
- **C**: Keep as-is until it breaks

### Q6: Should the GitLab integration use an SDK?

Currently uses raw axios. An SDK would provide:
- Type-safe API calls
- Automatic pagination handling
- Rate limiting
- Better error messages

But adds a dependency and may not match the project's "boring" principle
if the raw HTTP approach is working.

## Testing strategy

### Q7: Unit tests vs E2E tests -- where to invest?

Several connection types have E2E tests (via Vitest + Testcontainers + Synapse)
but no unit tests. E2E tests are slow but test real integration.

Should new test PRs focus on:
- **A**: Unit tests with mocked dependencies (fast, isolated, but less realistic)
- **B**: More E2E tests (slow, realistic, but harder to maintain)
- **C**: Both -- unit tests for logic, E2E tests for integration boundaries

### Q8: Mock strategy for external APIs

Testing connections requires mocking GitHub, GitLab, JIRA, etc. Options:
- **A**: Hand-written mocks per service
- **B**: Record/replay with tools like nock
- **C**: Contract testing with service-specific schemas
- **D**: Thin mock layer + E2E tests against real APIs in CI

### Q9: Should we set coverage thresholds?

No coverage thresholds are currently configured. Should we:
- Set a global minimum (e.g., 60%) and ratchet up?
- Set per-directory thresholds?
- Only enforce on new code?

## Rust migration

### Q10: What is the boundary between TypeScript and Rust?

Currently Rust handles:
- Feed parsing (RSS/Atom)
- Token encryption/decryption
- Message formatting and color handling
- Some JIRA/GitHub type utilities
- Config permissions

The boundary is "performance-critical or security-critical" operations.
Should the Rust migration expand this to "all pure logic" or stay focused
on performance/security?

### Q11: NAPI vs alternative FFI approaches?

The project uses NAPI-rs. Alternatives:
- **NAPI-rs** (current): Mature, good ergonomics, async support
- **wasm-bindgen**: WASM-based, no native compilation needed, portable
- **Neon**: Similar to NAPI but different API surface

NAPI-rs is working well. Is there a reason to reconsider?

### Q12: How to handle the matrix-bot-sdk dependency in Rust modules?

Matrix interactions currently go through TypeScript's matrix-bot-sdk. As more
logic moves to Rust, we'll need Matrix API access from Rust. Options:
- **A**: Keep Matrix calls in TypeScript, pass results to Rust
- **B**: Use `ruma` (Rust Matrix types, already a dependency) for full Rust Matrix client
- **C**: Thin TypeScript wrapper that delegates to Rust for logic
