# matrix-hookshot improvement project

This directory documents a structured effort to improve the matrix-hookshot codebase.
It tracks what we have done, why we are doing it, and what comes next.

## Guiding principles

The goal is a codebase that is:

- **Predictable** -- code does what it looks like it does, no hidden side effects
- **Flat** -- shallow call hierarchies, minimal indirection
- **Typed** -- the type system catches mistakes before tests do
- **Observable** -- metrics, logs, and errors surface problems early
- **Boring** -- well-understood patterns, nothing clever

See [PRINCIPLES.md](PRINCIPLES.md) for details.

## Documents

| File | Purpose |
|------|---------|
| [PRINCIPLES.md](PRINCIPLES.md) | Design principles in detail |
| [PLAN.md](PLAN.md) | Phased roadmap (tests, tooling, rust migration) |
| [COVERAGE_GAPS.md](COVERAGE_GAPS.md) | Current test coverage analysis and gap inventory |
| [EXTERNAL_APIS.md](EXTERNAL_APIS.md) | Research on external APIs the code depends on |
| [QUESTIONS.md](QUESTIONS.md) | Open questions about the codebase that need decisions |
| [TEST_IMPROVEMENT.md](TEST_IMPROVEMENT.md) | Plan for improving the test suite and tooling |
| [RUST_MIGRATION.md](RUST_MIGRATION.md) | Plan for incrementally replacing parts with Rust |

## How this project proceeds

1. **Phase 1 -- Test coverage**: Create tests for all features, one PR per feature area.
   Each PR describes what the tests cover and why.
2. **Phase 2 -- Test tooling**: One dedicated PR to make the test suite fast, clear on
   failure, behavior-driven, and unobtrusive to developers.
3. **Phase 3 -- Rust migration**: A series of individually-mergeable PRs that replace
   TypeScript modules with Rust via NAPI.

Work is tracked per-phase in [PLAN.md](PLAN.md).
