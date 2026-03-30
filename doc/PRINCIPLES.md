# Design principles

These principles guide every change we make to the codebase.

## Predictable

- Functions do one thing. Side effects are explicit.
- Data flows in one direction where possible.
- No magic: if code depends on something, it says so in the signature.
- Configuration is validated once at startup, then trusted.

## Flat

- Prefer composition over deep inheritance trees.
- Keep call depth shallow -- a developer should be able to trace a request
  through the system without jumping through more than 3-4 layers.
- Avoid unnecessary abstractions. Three similar lines are better than a
  premature helper.

## Typed

- Use TypeScript's type system to encode invariants.
- Discriminated unions over stringly-typed switches.
- No `any` except at FFI boundaries (NAPI, external webhook payloads).
- Validate external data at the boundary, then trust the types internally.

## Observable

- Every integration point emits Prometheus metrics.
- Errors include enough context to diagnose without reproducing.
- Log at appropriate levels: debug for flow, info for lifecycle events,
  warn for recoverable issues, error for things that need human attention.
- Health checks surface connection status to external services.

## Boring

- Use well-understood patterns from the Node.js and Rust ecosystems.
- Avoid clever abstractions. Code should read like documentation.
- Consistency matters more than local optimality -- follow existing patterns
  even if you'd do it differently in a greenfield project.
- When in doubt, do the obvious thing.
