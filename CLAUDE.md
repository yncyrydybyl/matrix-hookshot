# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Matrix Hookshot is a Matrix bot/bridge that connects Matrix rooms to external services: GitHub, GitLab, Jira, Figma, RSS/Atom feeds, and generic webhooks. It uses the Matrix appservice protocol and can run as a monolithic app or distributed across separate processes.

## Build & Development Commands

```bash
yarn build              # Full build (Rust → TypeScript → Web)
yarn build:app          # TypeScript only
yarn build:app:rs       # Rust native module only (NAPI)
yarn build:web          # Preact frontend only
yarn dev:web            # Vite dev server for frontend

yarn test               # Run all tests (mocha + ts-node)
yarn test -- --grep "pattern"  # Run tests matching a pattern

yarn lint               # Lint both TypeScript and Rust
yarn lint:js            # ESLint only
yarn lint:rs            # cargo fmt --check + clippy
yarn lint:rs:apply      # Auto-fix Rust lint issues

yarn start              # Run the main bridge app
yarn start:webhooks     # Run standalone webhook handler
yarn start:matrixsender # Run standalone Matrix message sender
```

**Build order matters:** Rust must compile before TypeScript (the build script handles this). The Rust layer produces NAPI bindings that TypeScript imports via `src/libRs.js`.

## Architecture

### Dual-language system
- **TypeScript** (primary): Bridge logic, Matrix protocol handling, webhook routing, admin commands
- **Rust** (via NAPI): Permissions system (`src/config/permissions.rs`), feed parsing (`src/feeds/`), format utilities, some type definitions

### Request flow
```
External webhook → Webhooks.ts (HTTP router)
  → Service-specific router (github/Router.ts, Gitlab/, jira/, etc.)
    → Connection handler (Connections/*.ts)
      → MessageQueue (in-process or Redis)
        → MatrixSender.ts → Matrix homeserver
```

### Key components
- **Bridge** (`src/Bridge.ts`): Main orchestrator — manages connections, webhooks, notifications, OAuth, admin rooms
- **ConnectionManager** (`src/ConnectionManager.ts`): Lifecycle management for room↔service connections
- **Connections** (`src/Connections/`): Per-service integration handlers. Each connection type (GithubRepo, GitlabRepo, JiraProject, FeedConnection, GenericHook, etc.) extends a base interface
- **Config** (`src/config/Config.ts`): YAML-based configuration with env var substitution and Rust-backed permissions
- **MessageQueue** (`src/MessageQueue/`): Two modes — monolithic (in-process) or distributed (Redis-backed with separate MatrixSender process)
- **AdminRoom** (`src/AdminRoom.ts`): Bot command handling for Matrix admin rooms

### Entry points (4 separate apps in `src/App/`)
- `BridgeApp.ts` — Main bridge (most common)
- `GithubWebhookApp.ts` — Standalone webhook handler
- `MatrixSenderApp.ts` — Message queue consumer
- `ResetCryptoStore.ts` — Crypto store cleanup utility

### Frontend
Preact + TypeScript + SCSS in `web/`, built with Vite. Two entry points: main widget UI (`index.html`) and OAuth flow (`oauth.html`). Build output goes to `public/`.

### Storage
Matrix state events are used as persistent storage by default (no external database required). Redis is optional for distributed deployments. Encrypted tokens stored via `UserTokenStore.ts`.

## Testing

- **Framework:** Mocha + Chai assertions + nyc coverage
- **Test location:** `tests/` — mix of `*Test.ts` and `*.spec.ts` files, organized by feature in subdirectories
- **Test init:** `tests/init.ts` sets up logging

## TypeScript Configuration

- Target: ES2021 (ES2022+ is broken per issue #729)
- Strict mode with decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Output directory: `lib/`
- `no-console` is an ESLint error — use the winston logger instead

## Rust Setup

Requires Rust toolchain via [rustup](https://rustup.rs/). The Rust code compiles as a cdylib NAPI module. Key crates: napi, serde, ruma, rss, atom_syndication.

## Branch Convention

Uses `main` as the primary branch (not `develop`).

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
