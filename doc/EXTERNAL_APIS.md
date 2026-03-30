# External API research

Research on external APIs and services that matrix-hookshot depends on.
Last reviewed: 2026-03-30.

## GitHub

**Packages**: `@octokit/rest` v20.1.2, `@octokit/auth-app` v6.1.4,
`@octokit/webhooks` v12.0.10

**API versions used**:
- REST API v3 (via Octokit)
- GraphQL API (for Discussions)
- GitHub Enterprise supported with `/api/v3` basepath

**Authentication**: GitHub App (installation tokens, OAuth2 device flow,
refresh tokens)

**Webhook events handled**: installation, repository, pull_request, issues,
discussion, push, release, and more.

**Status**: Current. Octokit v20 is actively maintained. GraphQL Discussions
API uses `discussions_api` feature header which is now stable. No deprecated
endpoints identified in use.

**Potential concerns**:
- GitHub is deprecating some REST endpoints in favor of GraphQL. Monitor for
  announcements affecting issue/PR APIs.
- The `discussions_api` feature header may become unnecessary as the API
  matures -- currently harmless but worth removing when no longer needed.

---

## GitLab

**Packages**: None (raw axios HTTP calls)

**API version**: v4 (hardcoded in all endpoint URLs)

**Authentication**: Bearer token (personal access token or OAuth token)

**Endpoints used**:
- `/api/v4/versions`, `/api/v4/user`
- `/api/v4/projects/{id}/issues`, `/api/v4/projects/{id}/hooks`
- `/api/v4/groups/{id}/projects`, `/api/v4/events`
- `/api/v4/projects/{id}/members/all/{id}`

**Webhook events handled**: merge_request, issue, note, tag_push, wiki_page,
release, push

**Status**: Current. GitLab API v4 is the current stable version. No v3
references remain in the codebase.

**Potential concerns**:
- No SDK used -- raw HTTP calls mean no automatic handling of API changes,
  pagination improvements, or rate limiting features that SDKs provide.
- Keyset pagination is used (good -- this is GitLab's recommended approach).

---

## JIRA

**Packages**: `jira-client` v8.2.2

**Two separate implementations**:

### JIRA Cloud
- **API version**: REST API v3
- **Authentication**: OAuth 2.0 via `auth.atlassian.com`
- **Endpoints**: `/rest/api/3/issue/{id}`, `/rest/api/3/project/search`
- **Status**: Current.

### JIRA Server (on-premise)
- **API version**: REST API v2
- **Authentication**: OAuth 1.0 (3-legged, RSA-SHA1)
- **Endpoints**: via `jira-client` library
- **Status**: **Concern** -- Atlassian ended support for JIRA Server in
  February 2024. JIRA Data Center continues but uses different APIs.

**Potential concerns**:
- `jira-client` v8.2.2 is not actively maintained. Last meaningful update
  was years ago. Consider migrating to a maintained alternative or raw HTTP.
- OAuth 1.0 with RSA-SHA1 is legacy. JIRA Data Center supports OAuth 2.0.
- The split between Cloud and On-Prem clients adds maintenance burden.
  With Server EOL, consider deprecating the On-Prem path or migrating
  it to Data Center's OAuth 2.0.

---

## Figma

**Packages**: `figma-js` v1.16.1-0

**API version**: REST API v2 (`https://api.figma.com/v2`)

**Endpoints used**:
- `/v2/me` -- current user
- `/v2/webhooks` -- webhook CRUD
- `/v2/webhooks/{id}` -- individual webhook operations

**Webhook events**: FILE_COMMENT

**Status**: Functional but the package version has a pre-release suffix (`-0`)
suggesting it was pinned to a specific pre-release.

**Potential concerns**:
- `figma-js` is not actively maintained (last publish was years ago).
  Consider migrating to Figma's official `@figma/rest-api-spec` or raw HTTP.
- Figma has introduced v2 webhook improvements and new event types
  (e.g., FILE_UPDATE, LIBRARY_PUBLISH) not currently handled.
- Only FILE_COMMENT events are processed -- this limits the integration's
  usefulness compared to what Figma's API now supports.

---

## OpenProject

**Packages**: None (raw axios HTTP calls)

**API version**: v3 (hardcoded in endpoints)

**Authentication**: OAuth 2.0 with Bearer token, automatic token refresh

**Endpoints used**:
- `/api/v3/users/{id}`, `/api/v3/projects`
- `/api/v3/work_packages`, `/api/v3/statuses`, `/api/v3/priorities`

**Status**: Current. API v3 is the active version.

**Potential concerns**:
- Like GitLab, no SDK is used. Raw HTTP calls require manual maintenance.
- Token refresh is implemented but error handling for expired refresh tokens
  should be verified.

---

## RSS/Atom feeds

**Rust crates**: `rss` v2.0, `atom_syndication` v0.12, `reqwest` v0.13.0

**Standards supported**: RSS 2.0, Atom 1.0

**Features**: ETag/Last-Modified caching, configurable polling, exponential
backoff, MD5-based deduplication

**Status**: Current. Both Rust crates are actively maintained.

**Potential concerns**:
- MD5 is used for feed item deduplication (not for security). This is fine
  but could be replaced with a faster hash if performance matters.
- `reqwest` v0.13 is current.

---

## Generic webhooks

**No external API dependency**. Accepts arbitrary HTTP payloads and transforms
them with user-supplied JavaScript via QuickJS (sandboxed WASM).

**Formats**: JSON, URL-encoded, XML (via xml2js), plain text

**Status**: Functional. QuickJS sandbox provides isolation.

**Potential concerns**:
- Legacy v1 transformation API is still supported alongside v2. The v1 path
  is marked deprecated but has no removal timeline.
- 500ms transformation timeout is hardcoded -- should be configurable.
- XML parsing uses xml2js which has had CVEs in the past. Verify current
  version is patched.

---

## Matrix SDK stack

**Packages**:
- `matrix-appservice-bridge` v11.2.0
- `matrix-bot-sdk` v0.8.0-element.3
- `matrix-widget-api` v1.10.0

**Status**: These are maintained by Element (the primary Matrix client vendor).
The `element.3` suffix on matrix-bot-sdk indicates a custom fork.

**Potential concerns**:
- Using an Element-specific fork of matrix-bot-sdk ties the project to
  Element's release cadence and priorities.
- matrix-appservice-bridge v11 is current but breaking changes between major
  versions have been significant historically.

---

## Summary of action items

| Priority | Item |
|----------|------|
| High | Evaluate `jira-client` replacement (unmaintained, JIRA Server EOL) |
| High | Evaluate `figma-js` replacement (unmaintained, pre-release pin) |
| Medium | Consider deprecating JIRA Server/On-Prem OAuth 1.0 path |
| Medium | Verify xml2js version against known CVEs |
| Medium | Add GitLab SDK or at least structured HTTP client |
| Low | Remove legacy generic webhook v1 API |
| Low | Make webhook transformation timeout configurable |
| Low | Remove `discussions_api` GraphQL feature header when no longer needed |
