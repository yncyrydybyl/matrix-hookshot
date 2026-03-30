# Rust migration plan

Phase 3: incrementally replace TypeScript modules with Rust via NAPI.
Each PR is independently mergeable.

## Current Rust footprint

The project already uses Rust via NAPI-rs for:

| Module | Location | Purpose |
|--------|----------|---------|
| format_util | `src/format_util.rs` | Message formatting, color handling, HTML sanitization |
| feeds/parser | `src/feeds/parser.rs` | RSS/Atom feed parsing |
| tokens | `src/tokens/mod.rs` | Token encryption/decryption (RSA) |
| github/types | `src/github/types.rs` | GitHub type utilities for NAPI |
| jira/types | `src/jira/types.rs` | JIRA formatting and type utilities |
| jira/utils | `src/jira/utils.rs` | JIRA utility functions |
| config/permissions | `src/config/permissions.rs` | Permission enforcement |
| util | `src/util/mod.rs` | General utilities |

**Build**: `napi build --dts` via `yarn build:app:rs`
**Output**: `matrix-hookshot-rs` native module in `lib/`
**Entry**: `src/lib.rs` declares all modules, `src/libRs.js` provides JS wrapper

## Migration principles

1. **One module per PR** -- each PR replaces exactly one TypeScript module
2. **Same API surface** -- the NAPI interface matches the existing TypeScript API
3. **Tests first** -- the module must have tests before migration (Phase 1 dependency)
4. **Feature parity** -- no behavior changes during migration
5. **Rollback plan** -- keep the TypeScript source in the repo until the Rust
   version has been in production for at least one release cycle

## Migration candidates (ordered by independence and risk)

### PR 1: Webhook payload validation

**What**: Move JSON schema validation for incoming webhooks to Rust.
**Why**: CPU-bound operation that runs on every incoming webhook. Rust's serde
provides zero-copy deserialization.
**Size**: Small (~200 lines of TypeScript to replace)
**Dependencies**: None (pure validation logic)
**Risk**: Low

### PR 2: Configuration parsing and validation

**What**: Move config YAML parsing and validation to Rust.
**Why**: Complex validation logic that runs once at startup. Rust's type system
can encode validation rules at compile time.
**Size**: Medium (~1,200 lines across config/ directory)
**Dependencies**: None (runs at startup before other code)
**Risk**: Low (startup-only, easy to test)

### PR 3: Generic webhook transformation engine

**What**: Replace QuickJS-based JavaScript transformation sandbox with a Rust
implementation.
**Why**: QuickJS WASM adds significant bundle size. A Rust-native sandbox
(using `boa_engine` or similar) would be faster and smaller.
**Size**: Medium (~300 lines of transformation logic)
**Dependencies**: None (self-contained module)
**Risk**: Medium (must maintain JavaScript API compatibility for user scripts)

### PR 4: GitLab HTTP client

**What**: Move GitLab API client from axios to Rust (reqwest, already a dependency).
**Why**: Self-contained HTTP + JSON parsing. Rust types provide compile-time
API contract validation.
**Size**: Medium (~700 lines across gitlab/ directory)
**Dependencies**: Tests for GitLab connection (Phase 1, PR #7)
**Risk**: Medium (HTTP error handling, pagination)

### PR 5: JIRA HTTP client

**What**: Move JIRA API client to Rust, unifying Cloud and On-Prem clients.
**Why**: Replace unmaintained `jira-client` package. Rust can handle OAuth
flows natively.
**Size**: Large (~800 lines across jira/ directory)
**Dependencies**: Tests for JIRA connection (Phase 1, PR #3), decision on Q4
(JIRA Server deprecation)
**Risk**: Medium-High (two OAuth flows, complex API surface)

### PR 6: Notification filtering

**What**: Move notification filter logic to Rust.
**Why**: Pure logic with no I/O dependencies. Benefits from Rust's pattern
matching for filter expressions.
**Size**: Small (~91 lines in NotificationFilters.ts + related code)
**Dependencies**: Tests for notification system (Phase 1, PR #12)
**Risk**: Low

### PR 7: Connection state machines

**What**: Move connection state management logic to Rust.
**Why**: Core business logic that benefits from Rust's enum types and
exhaustive matching. Prevents invalid state transitions at compile time.
**Size**: Large (depends on how many connections are migrated)
**Dependencies**: All connection tests (Phase 1), test tooling (Phase 2)
**Risk**: High (touches core system, many integration points)

### PR 8: Storage providers

**What**: Move MemoryStorageProvider and RedisStorageProvider to Rust.
**Why**: Ownership model prevents data races. Redis operations benefit from
Rust's async runtime.
**Size**: Medium (~741 lines across stores/)
**Dependencies**: Tests for storage (Phase 1, PR #13)
**Risk**: Medium (Redis connection management, error handling)

### PR 9: Message queue

**What**: Move LocalMQ and RedisQueue to Rust.
**Why**: Concurrency-critical code. Rust's ownership model prevents race
conditions that are easy to introduce in TypeScript.
**Size**: Small-Medium (~264 lines across messageQueue/)
**Dependencies**: Tests for message queue (Phase 1, PR #14)
**Risk**: Medium (concurrency, async lifecycle)

## NAPI patterns to follow

The existing Rust code establishes these patterns:

```rust
// Expose functions via #[napi]
#[napi]
pub fn format_message(body: String, html: bool) -> String { ... }

// Expose structs via #[napi(object)]
#[napi(object)]
pub struct FeedEntry {
    pub title: Option<String>,
    pub link: Option<String>,
}

// Async operations
#[napi]
pub async fn fetch_feed(url: String) -> Result<Vec<FeedEntry>> { ... }
```

Follow these patterns for consistency. Use `napi::Result` for error handling.

## Build considerations

- Rust compilation adds ~30-60s to CI builds
- Each new Rust module increases compile time marginally
- Consider using `cargo workspace` if the Rust codebase grows significantly
- Cross-compilation for arm64 is already handled in the Dockerfile

## Success criteria for each PR

1. All existing tests pass (both unit and E2E)
2. No behavior changes (verified by test comparison)
3. Performance is equal or better (benchmarked for hot paths)
4. TypeScript types are preserved (NAPI generates `.d.ts` files)
5. Error messages are equivalent or better
