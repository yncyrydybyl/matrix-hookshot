---
title: Installation
description: Install hookshot via Docker, Helm, Nix, or from source
audience: [operator]
---

# Installation

Hookshot runs as a Node.js application with Rust native modules. It requires a Matrix homeserver with appservice support.

## Requirements

- A Matrix homeserver (Synapse, Dendrite, or Conduit) with **admin access** to register appservices
- Network access between hookshot and the homeserver
- For webhook-based integrations: a public URL reachable by external services

Hookshot uses ~100 MB of memory at baseline. Memory grows with the number of bridged rooms.

## Docker (recommended)

```bash
docker run \
    --name hookshot \
    -d \
    -p 9993:9993 \
    -p 9000:9000 \
    -p 9002:9002 \
    -v /etc/hookshot:/data \
    halfshot/matrix-hookshot:latest
```

Mount `/etc/hookshot` (or any directory) containing:
- `config.yml` — bridge configuration
- `registration.yml` — appservice registration
- `passkey.pem` — token encryption key

In your `config.yml`, use `/data/passkey.pem` as the `passFile` path.

**Port mapping:**

| Port | Purpose | Needs to be public? |
|---|---|---|
| 9993 | Appservice API (homeserver → hookshot) | No — homeserver only |
| 9000 | Webhooks (external services → hookshot) | Yes |
| 9002 | Metrics + widgets | Depends on setup |

Docker images: [`halfshot/matrix-hookshot`](https://hub.docker.com/r/halfshot/matrix-hookshot)

## Helm (Kubernetes)

A basic Helm chart is available in `helm/hookshot/`.

```bash
helm install hookshot ./helm/hookshot \
    --set config.bridge.domain=example.com \
    --set config.bridge.url=http://synapse:8008
```

See [helm/hookshot/README.md](https://github.com/matrix-org/matrix-hookshot/blob/main/helm/hookshot/README.md) for chart values.

## From source

Requires Node.js 22+ and Rust (via [rustup](https://rustup.rs/)).

```bash
git clone https://github.com/matrix-org/matrix-hookshot.git
cd matrix-hookshot
yarn install
yarn build       # Compiles TypeScript + Rust
```

Start:

```bash
NODE_ENV=production yarn start
```

Or with explicit config paths:

```bash
node lib/App/BridgeApp.js config.yml registration.yml
```

## Nix

A `devenv.nix` is provided for Nix-based development environments.

```bash
devenv shell
yarn install
yarn build
```

## Generate the passkey

Hookshot encrypts stored tokens with an RSA key. Generate one:

```bash
openssl genpkey -out passkey.pem -outform PEM -algorithm RSA -pkeyopt rsa_keygen_bits:4096
```

Set `passFile: ./passkey.pem` in your config. **Keep this file secure** — it protects all stored OAuth tokens.

## Create the registration file

Copy `registration.sample.yml` to `registration.yml` and configure:

```yaml
id: matrix-hookshot
as_token: <generate-random-string>
hs_token: <generate-random-string>
namespaces:
  rooms: []
  users:
    - regex: "@_github_.*:yourdomain"
      exclusive: true
    - regex: "@_gitlab_.*:yourdomain"
      exclusive: true
    - regex: "@_jira_.*:yourdomain"
      exclusive: true
    - regex: "@_webhooks_.*:yourdomain"
      exclusive: true
  aliases:
    - regex: "#github_.+:yourdomain"
      exclusive: true
sender_localpart: hookshot
url: "http://localhost:9993"  # Where homeserver reaches hookshot
rate_limited: false
```

Generate random tokens:

```bash
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
```

Replace `yourdomain` with your homeserver's server name.

<!-- Code: registration.sample.yml -->

## Register with the homeserver

### Synapse

Add to your Synapse `homeserver.yaml`:

```yaml
app_service_config_files:
  - /path/to/hookshot/registration.yml
```

Restart Synapse.

See [Synapse appservice docs](https://element-hq.github.io/synapse/latest/application_services.html).

### Dendrite

Add to your Dendrite config:

```yaml
app_service_api:
  config_files:
    - /path/to/hookshot/registration.yml
```

## Validate your config

Before starting, validate the config file:

```bash
# From source
yarn validate-config

# Docker
docker run --rm \
    -v /path/to/config.yml:/config.yml \
    halfshot/matrix-hookshot \
    node config/Config.js /config.yml
```

## Verify it works

After starting hookshot, check the logs for:

```
info: Homeserver is ready
info: Bridge has started
```

If you see `Failed to connect to homeserver`, verify:
- `bridge.url` in config.yml points to a reachable homeserver
- The registration file is configured on both sides
- `as_token` and `hs_token` match between config and registration

## Next steps

- [Configuration](configuration.md) — Full config walkthrough
- [Quickstart](../../get-started/quickstart.md) — Try it with docker-compose
- [Integration Overview](../../integrations/overview.md) — Enable specific services

## Related

- [What is Hookshot](../../understand/what-is-hookshot.md) — System overview
- [Trust and Boundaries](../../understand/trust-and-boundaries.md) — Security model
- [Troubleshooting](../../troubleshooting/index.md) — Common problems
