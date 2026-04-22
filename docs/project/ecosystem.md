---
title: Ecosystem
description: Hookshot forks, deployments, community usage, and platform presence
audience: [evaluator, contributor, architect]
---

# Ecosystem

Matrix Hookshot exists within a broader ecosystem of forks, deployment tools, and community resources. This page maps the landscape.

## Upstream project

**Repository:** [matrix-org/matrix-hookshot](https://github.com/matrix-org/matrix-hookshot)
**Maintainer:** Element (via matrix-org GitHub org)
**License:** Apache 2.0
**Latest docs:** [matrix-org.github.io/matrix-hookshot](https://matrix-org.github.io/matrix-hookshot/latest/)
**Support room:** [#hookshot:half-shot.uk](https://matrix.to/#/#hookshot:half-shot.uk)

### Activity (as of April 2026)

- ~50 open issues, ~47 open PRs (including Renovate dependency updates)
- Active development with regular releases
- Originally named `matrix-github`, renamed to `matrix-hookshot` to reflect multi-service support

## Forks

85+ forks on GitHub. Most are personal copies. Notable active forks:

| Fork | Last pushed | Notes |
|---|---|---|
| [HarHarLinks/matrix-hookshot](https://github.com/HarHarLinks/matrix-hookshot) | Jan 2026 | Recent activity |
| [SpiritCroc/matrix-hookshot](https://github.com/SpiritCroc/matrix-hookshot) | Jan 2025 | SchildiChat developer |
| [opf/matrix-hookshot](https://github.com/opf/matrix-hookshot) | Dec 2024 | OpenProject Foundation — maintains OpenProject integration |
| [yncyrydybyl/matrix-hookshot](https://github.com/yncyrydybyl/matrix-hookshot) | Apr 2026 | This fork — documentation restructuring |
| [globekeeper/bridges-as](https://github.com/globekeeper/bridges-as) | Feb 2024 | Renamed, customized for their platform |
| [turt2live/matrix-hookshot](https://github.com/turt2live/matrix-hookshot) | Dec 2021 | t2bot.io operator (historical) |
| [t2bot/matrix-github](https://github.com/t2bot/matrix-github) | — | Legacy pre-rename fork |

### Code platforms

- **GitHub:** Primary home (matrix-org/matrix-hookshot) + 85 forks
- **Codeberg/Gitea:** No official mirror. Feature request for Gitea/Forgejo support exists ([#304](https://github.com/matrix-org/matrix-hookshot/issues/304)) — would enable Codeberg integration
- **GitLab:** No known mirrors. GitLab is supported as an *integration target*, not a hosting platform for hookshot
- **DeepWiki:** AI-generated documentation at [deepwiki.com/matrix-org/matrix-hookshot](https://deepwiki.com/matrix-org/matrix-hookshot)

## Deployment methods

### matrix-docker-ansible-deploy

The most popular way to deploy hookshot. Part of [spantaleev/matrix-docker-ansible-deploy](https://github.com/spantaleev/matrix-docker-ansible-deploy).

- **Config guide:** [configuring-playbook-bridge-hookshot.md](https://github.com/spantaleev/matrix-docker-ansible-deploy/blob/master/docs/configuring-playbook-bridge-hookshot.md)
- **Enable:** `matrix_hookshot_enabled: true` in `vars.yml`
- Handles config generation, registration, Docker image, reverse proxy
- Actively maintained, tracks hookshot releases

### Element Server Suite (ESS)

[Element Server Suite Community Edition](https://element.io/en/server-suite/community) includes hookshot as an optional component.

- **Helm chart:** [element-hq/ess-helm](https://github.com/element-hq/ess-helm)
- **Config guide:** [Configuring Hookshot (ESS Pro)](https://docs.element.io/latest/element-server-suite-pro/configuring-components/configuring-hookshot/)
- Hookshot disabled by default — must be explicitly enabled
- ESS Community is free (AGPLv3) for non-commercial use, up to ~100 users

### NixOS / nixpkgs

Hookshot is packaged in nixpkgs.

- **Package:** `matrix-hookshot` (currently v6.0.2)
- **Recent PRs:** [v6.0.1 → v6.0.2 update](https://github.com/NixOS/nixpkgs/pull/376057), [auto-update script added](https://github.com/NixOS/nixpkgs/pull/366107)
- **NixOS Wiki:** [Matrix page](https://nixos.wiki/wiki/Matrix) mentions hookshot

### Docker (standalone)

Official image: [`halfshot/matrix-hookshot`](https://hub.docker.com/r/halfshot/matrix-hookshot)

See [Installation guide](../guides/operator/installation.md#docker-recommended).

### Helm (standalone)

Built-in chart at `helm/hookshot/` in the repo. See [Installation guide](../guides/operator/installation.md#helm-kubernetes).

## matrix.org coverage

Hookshot appears regularly in [This Week in Matrix (TWIM)](https://matrix.org/blog/category/this-week-in-matrix/) blog posts:

- Multiple TWIM mentions from 2021–2026 covering releases, features, and community contributions
- Key announcements: rename from matrix-github, service bots feature, encryption improvements, OpenProject support
- [TWIM 2026-02-06](https://matrix.org/blog/2026/02/06/this-week-in-matrix-2026-02-06/) — latest coverage

## Community resources

| Resource | URL |
|---|---|
| Support room | [#hookshot:half-shot.uk](https://matrix.to/#/#hookshot:half-shot.uk) |
| Official docs | [matrix-org.github.io/matrix-hookshot](https://matrix-org.github.io/matrix-hookshot/latest/) |
| Ansible deploy guide | [configuring-playbook-bridge-hookshot.md](https://github.com/spantaleev/matrix-docker-ansible-deploy/blob/master/docs/configuring-playbook-bridge-hookshot.md) |
| ESS docs | [docs.element.io — Hookshot](https://docs.element.io/latest/element-server-suite-pro/configuring-components/configuring-hookshot/) |
| NixOS wiki | [nixos.wiki/wiki/Matrix](https://nixos.wiki/wiki/Matrix) |
| Grafana dashboard | [contrib/hookshot-dashboard.json](https://github.com/matrix-org/matrix-hookshot/blob/main/contrib/hookshot-dashboard.json) |

## Related

**Project:** [Roadmap](roadmap.md) · [Limitations](limitations.md)

**Operator:** [Installation](../guides/operator/installation.md) · [Configuration](../guides/operator/configuration.md)

**Concepts:** [What is Hookshot](../understand/what-is-hookshot.md)
