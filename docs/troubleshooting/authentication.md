---
title: "Troubleshooting: Authentication"
description: Diagnose OAuth, token, and credential problems
audience: [operator, user]
symptoms: ["not authorized", "token expired", "login failed", "OAuth error"]
---

# Authentication Issues

OAuth flows failing, "not authorized" errors, or token problems. Work through the checks for your service.

## Check 1: Do you have permission to authenticate?

Hookshot's permission system controls who can log in. The minimum level is `login`.

In a DM with the hookshot bot, send:

```
!hookshot help
```

If the bot doesn't respond or says "no permission", ask your admin to check the `permissions` config:

```yaml
permissions:
  - actor: example.com
    services:
      - service: github   # or "*" for all
        level: login       # minimum for OAuth
```

> **Source:** [`src/config/permissions.rs`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/config/permissions.rs) · [`src/config/Config.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/config/Config.ts)

## Check 2: Is the service configured for OAuth?

### GitHub

`!github login` requires OAuth config:

```yaml
github:
  oauth:
    client_id: "Iv1.abc123"
    client_secret: "secret"
    redirect_uri: "https://hookshot.example.com/oauth"
```

The `redirect_uri` must match **exactly** what's configured in the GitHub App settings.

If missing, `!github login` will fail silently or return an error.

Alternative: `!github setpersonaltoken <token>` doesn't need OAuth config.

> **Source:** [`src/github/GithubInstance.ts:269-285`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/github/GithubInstance.ts#L269-L285)

### JIRA

`!hookshot jira login` requires:

```yaml
jira:
  oauth:
    client_id: "your-client-id"
    client_secret: "your-client-secret"
    redirect_uri: "https://hookshot.example.com/oauth"
```

### GitLab

GitLab uses personal access tokens, not OAuth:

```
!hookshot gitlab personaltoken <instance-name> <token>
```

The `<instance-name>` must match an instance defined in config:

```yaml
gitlab:
  instances:
    gitlab.com:
      url: https://gitlab.com
```

## Check 3: Is the token expired?

Check your auth status:

| Service | Command | What it shows |
|---|---|---|
| GitHub | `!github status` | Logged-in username or "not authenticated" |
| JIRA | `!hookshot jira whoami` | JIRA identity or error |
| GitLab | `!hookshot gitlab hastoken <instance>` | Whether a token is stored |

If expired:
- GitHub: `!github login` (re-authenticate) or `!github setpersonaltoken <new-token>`
- JIRA: `!hookshot jira login` (re-authenticate)
- GitLab: `!hookshot gitlab personaltoken <instance> <new-token>`

> **Source:** [`src/github/AdminCommands.ts:81-113`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/github/AdminCommands.ts#L81-L113)

## Check 4: Is the redirect URI correct?

OAuth flows redirect the user to an external service, then back to hookshot. The redirect URI must:

1. Match **exactly** between hookshot config and the external service settings
2. Be reachable from the user's browser (not just from hookshot's server)
3. Use HTTPS in production

Common mistakes:
- Trailing slash mismatch: `https://example.com/oauth` vs `https://example.com/oauth/`
- HTTP vs HTTPS
- Wrong port or path

## Check 5: Is the token store working?

Tokens are encrypted with the `passFile` RSA key. If the passkey changes, all stored tokens become unreadable.

Symptoms:
- Users were authenticated, then suddenly aren't after a restart
- Encryption errors in logs

Fix: Users must re-authenticate (`!github login`, etc.). There is no way to recover tokens encrypted with a lost passkey.

> **Source:** [`src/tokens/mod.rs`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/tokens/mod.rs)

## Check 6: GitHub App authentication (instance-level)

If no webhooks are arriving (separate from user auth), the GitHub App itself may not be authenticating:

1. Check the App ID matches `github.auth.id` in config
2. Check the private key file exists and is readable at the path in `github.auth.privateKeyFile`
3. Check logs for `Failed to authenticate as GitHub App` or similar

```bash
# Verify the key file is valid
openssl rsa -in github-key.pem -check -noout
```

## Error messages

| Error | Cause | Fix |
|---|---|---|
| "You do not have permission" | Permission level too low | Admin: set `level: login` or higher |
| "Not authenticated" | No token stored for this user | Run the login command for the service |
| "Token expired" | OAuth token expired and refresh failed | Re-authenticate |
| "Invalid redirect_uri" | Mismatch between config and service settings | Ensure exact match |
| "OAuth state mismatch" | Stale or replayed OAuth callback | Retry the login flow |

## Related

- [Trust and Boundaries](../understand/trust-and-boundaries.md) — Auth model overview
- [GitHub Integration](../integrations/github.md#authentication) — GitHub auth details
- [Configuration: Permissions](../guides/operator/configuration.md#permissions)
- [Troubleshooting Index](index.md)
