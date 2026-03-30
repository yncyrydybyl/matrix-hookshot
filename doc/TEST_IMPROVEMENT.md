# Test suite improvement plan

Single PR to improve the test infrastructure. This is Phase 2 of the project.

## Goals

1. **Fast** -- unit tests complete in seconds
2. **Clear failures** -- output tells you what broke and why
3. **Behavior-driven** -- tests describe what the system does
4. **Stays out of the way** -- no flaky tests, minimal setup, fast feedback

## Current problems

### Speed
- Mocha + ts-node recompiles TypeScript on every run
- No parallelization of test suites
- E2E tests spin up Docker containers (Synapse) per test file
- No test filtering by changed files

### Failure clarity
- Chai assertions produce generic messages ("expected false to be true")
- No structured diff output for object comparisons
- E2E test failures don't indicate which step failed in a multi-step flow

### Test organization
- Mixed naming: some files are `*.spec.ts`, others are plain `*.ts`
- Test utilities are in `tests/utils/` but connection tests define their
  own utilities inline (e.g., `GenericHookTest.ts` is 624 lines)
- No consistent pattern for test setup/teardown

### Developer experience
- No watch mode configured for unit tests
- Coverage reports require a separate command (`yarn test:cover`)
- No way to run a single test file easily from the CLI
- E2E tests retry 3x in CI which masks flaky tests instead of fixing them

## Proposed changes

### 1. Unify on Vitest for all tests

Replace Mocha + Chai with Vitest for unit tests too.

Why:
- Vitest is already used for E2E tests
- Built-in TypeScript support (no ts-node compilation step)
- Built-in coverage (c8/v8, replaces NYC)
- Built-in watch mode
- Compatible with Chai assertions (migration is incremental)
- Parallel test execution by default
- Better error messages with inline diffs

Migration path:
- Rename `tests/` files to `*.spec.ts` (consistent naming)
- Update imports from chai to vitest's `expect`
- Move mocha config to vitest config
- Remove mocha, chai, nyc, ts-node test dependencies

### 2. Consistent test file naming and location

```
tests/
  unit/
    connections/
      GenericHook.spec.ts
      GithubRepo.spec.ts
      GitlabRepo.spec.ts
      ...
    core/
      Bridge.spec.ts
      ConnectionManager.spec.ts
      BotCommands.spec.ts
      ...
    services/
      github/
      gitlab/
      jira/
      ...
  integration/
    (move current spec/ files here)
  fixtures/
    (shared test data)
  mocks/
    (shared mocks)
```

### 3. Build a mock library for external services

Create lightweight mocks for each external service:

```typescript
// tests/mocks/github.ts
export function createMockOctokit(overrides?: Partial<Octokit>): Octokit

// tests/mocks/gitlab.ts
export function createMockGitlabClient(overrides?: Partial<GitLabClient>): GitLabClient

// tests/mocks/matrix.ts
export function createMockIntent(overrides?: Partial<Intent>): Intent
export function createMockAppservice(): Appservice

// tests/mocks/jira.ts
export function createMockJiraClient(overrides?: Partial<JiraClient>): JiraClient
```

### 4. Test factories for connections

```typescript
// tests/factories/connections.ts
export function createGithubRepoConnection(
  overrides?: Partial<GithubRepoConnectionState>
): GithubRepoConnection

export function createGenericHookConnection(
  overrides?: Partial<GenericHookConnectionState>
): GenericHookConnection
```

This eliminates boilerplate in every test file.

### 5. Behavior-driven test style

Tests should read like specifications:

```typescript
// Bad: implementation-focused
describe('GithubRepoConnection', () => {
  it('should call octokit.issues.create with correct params', () => { ... })
})

// Good: behavior-focused
describe('GithubRepoConnection', () => {
  describe('when receiving a push event', () => {
    it('sends a formatted message to the Matrix room', () => { ... })
    it('includes the commit count in the message', () => { ... })
    it('skips the message if the branch is excluded', () => { ... })
  })
})
```

### 6. Coverage configuration

Add to vitest config:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  // Start low, ratchet up as coverage improves
  thresholds: {
    lines: 30,
    branches: 25,
    functions: 25,
    statements: 30,
  },
  exclude: [
    'tests/**',
    'spec/**',
    'web/**',
    '**/*.d.ts',
  ],
}
```

### 7. CI improvements

- Run unit tests and E2E tests as separate CI jobs (unit tests gate faster)
- Fail on coverage regression (ratchet mechanism)
- Remove the 3x retry on E2E tests -- fix flaky tests instead
- Add test timing to CI output to catch slow tests early

## Estimated impact

| Metric | Before | After |
|--------|--------|-------|
| Unit test runtime | ~15s (ts-node compile + run) | ~3s (Vitest native TS) |
| Test frameworks | 2 (Mocha + Vitest) | 1 (Vitest) |
| Coverage tools | NYC | Vitest built-in (v8) |
| Watch mode | Not available | Built-in |
| Test naming | Inconsistent | `*.spec.ts` everywhere |
