import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Matrix Hookshot',
  description: 'Connect Matrix to the tools your team uses',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.png' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Hookshot',

    nav: [
      { text: 'Get Started', link: '/get-started/quickstart' },
      { text: 'Integrations', link: '/integrations/overview' },
      { text: 'Guides', link: '/guides/operator/installation' },
      { text: 'Architecture', link: '/architecture/connections' },
      { text: 'Reference', link: '/reference/bot-commands' },
      {
        text: 'Versions',
        items: [
          {
            text: 'Current (VitePress)',
            items: [
              { text: 'Latest (new docs)', link: '/' },
            ],
          },
          {
            text: 'v7.x',
            items: [
              { text: '7.3.2', link: 'https://matrix-org.github.io/matrix-hookshot/7.3.2/' },
              { text: '7.3.1', link: 'https://matrix-org.github.io/matrix-hookshot/7.3.1/' },
              { text: '7.3.0', link: 'https://matrix-org.github.io/matrix-hookshot/7.3.0/' },
              { text: '7.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/7.2.0/' },
              { text: '7.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/7.1.0/' },
              { text: '7.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/7.0.0/' },
            ],
          },
          {
            text: 'v6.x',
            items: [
              { text: '6.0.3', link: 'https://matrix-org.github.io/matrix-hookshot/6.0.3/' },
              { text: '6.0.2', link: 'https://matrix-org.github.io/matrix-hookshot/6.0.2/' },
              { text: '6.0.1', link: 'https://matrix-org.github.io/matrix-hookshot/6.0.1/' },
              { text: '6.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/6.0.0/' },
            ],
          },
          {
            text: 'v5.x',
            items: [
              { text: '5.4.2', link: 'https://matrix-org.github.io/matrix-hookshot/5.4.2/' },
              { text: '5.4.1', link: 'https://matrix-org.github.io/matrix-hookshot/5.4.1/' },
              { text: '5.4.0', link: 'https://matrix-org.github.io/matrix-hookshot/5.4.0/' },
              { text: '5.3.0', link: 'https://matrix-org.github.io/matrix-hookshot/5.3.0/' },
              { text: '5.2.1', link: 'https://matrix-org.github.io/matrix-hookshot/5.2.1/' },
              { text: '5.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/5.2.0/' },
              { text: '5.1.2', link: 'https://matrix-org.github.io/matrix-hookshot/5.1.2/' },
              { text: '5.1.1', link: 'https://matrix-org.github.io/matrix-hookshot/5.1.1/' },
              { text: '5.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/5.1.0/' },
              { text: '5.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/5.0.0/' },
            ],
          },
          {
            text: 'v4.x',
            items: [
              { text: '4.7.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.7.0/' },
              { text: '4.6.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.6.0/' },
              { text: '4.5.1', link: 'https://matrix-org.github.io/matrix-hookshot/4.5.1/' },
              { text: '4.5.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.5.0/' },
              { text: '4.4.1', link: 'https://matrix-org.github.io/matrix-hookshot/4.4.1/' },
              { text: '4.4.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.4.0/' },
              { text: '4.3.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.3.0/' },
              { text: '4.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.2.0/' },
              { text: '4.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.1.0/' },
              { text: '4.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/4.0.0/' },
            ],
          },
          {
            text: 'v3.x',
            items: [
              { text: '3.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/3.2.0/' },
              { text: '3.1.1', link: 'https://matrix-org.github.io/matrix-hookshot/3.1.1/' },
              { text: '3.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/3.1.0/' },
              { text: '3.0.1', link: 'https://matrix-org.github.io/matrix-hookshot/3.0.1/' },
              { text: '3.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/3.0.0/' },
            ],
          },
          {
            text: 'v2.x',
            items: [
              { text: '2.7.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.7.0/' },
              { text: '2.6.1', link: 'https://matrix-org.github.io/matrix-hookshot/2.6.1/' },
              { text: '2.6.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.6.0/' },
              { text: '2.5.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.5.0/' },
              { text: '2.4.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.4.0/' },
              { text: '2.3.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.3.0/' },
              { text: '2.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.2.0/' },
              { text: '2.1.2', link: 'https://matrix-org.github.io/matrix-hookshot/2.1.2/' },
              { text: '2.1.1', link: 'https://matrix-org.github.io/matrix-hookshot/2.1.1/' },
              { text: '2.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.1.0/' },
              { text: '2.0.1', link: 'https://matrix-org.github.io/matrix-hookshot/2.0.1/' },
              { text: '2.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/2.0.0/' },
            ],
          },
          {
            text: 'v1.x',
            items: [
              { text: '1.8.1', link: 'https://matrix-org.github.io/matrix-hookshot/1.8.1/' },
              { text: '1.8.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.8.0/' },
              { text: '1.7.3', link: 'https://matrix-org.github.io/matrix-hookshot/1.7.3/' },
              { text: '1.7.2', link: 'https://matrix-org.github.io/matrix-hookshot/1.7.2/' },
              { text: '1.7.1', link: 'https://matrix-org.github.io/matrix-hookshot/1.7.1/' },
              { text: '1.7.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.7.0/' },
              { text: '1.6.1', link: 'https://matrix-org.github.io/matrix-hookshot/1.6.1/' },
              { text: '1.6.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.6.0/' },
              { text: '1.5.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.5.0/' },
              { text: '1.4.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.4.0/' },
              { text: '1.3.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.3.0/' },
              { text: '1.2.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.2.0/' },
              { text: '1.1.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.1.0/' },
              { text: '1.0.0', link: 'https://matrix-org.github.io/matrix-hookshot/1.0.0/' },
            ],
          },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Quickstart', link: '/get-started/quickstart' },
          { text: 'Evaluate', link: '/get-started/evaluate' },
          { text: 'Tutorial: First Webhook', link: '/get-started/first-webhook' },
          { text: 'Tutorial: GitHub Notifications', link: '/get-started/first-github-notification' },
        ],
      },
      {
        text: 'Understand',
        items: [
          { text: 'What is Hookshot', link: '/understand/what-is-hookshot' },
          { text: 'Event Lifecycle', link: '/understand/event-lifecycle' },
          { text: 'Integration Model', link: '/understand/integration-model' },
          { text: 'Trust and Boundaries', link: '/understand/trust-and-boundaries' },
          { text: 'Glossary', link: '/understand/glossary' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Overview', link: '/integrations/overview' },
          { text: 'GitHub', link: '/integrations/github' },
          { text: 'GitLab', link: '/integrations/gitlab' },
          { text: 'JIRA', link: '/integrations/jira' },
          { text: 'Generic Webhooks', link: '/integrations/generic-webhooks' },
          { text: 'RSS/Atom Feeds', link: '/integrations/feeds' },
          { text: 'Figma', link: '/integrations/figma' },
          { text: 'OpenProject', link: '/integrations/openproject' },
          { text: 'ChallengeHound', link: '/integrations/challengehound' },
        ],
      },
      {
        text: 'Architecture',
        collapsed: true,
        items: [
          { text: 'Connections', link: '/architecture/connections' },
          { text: 'State and Storage', link: '/architecture/state-and-storage' },
          { text: 'Component Model', link: '/architecture/component-model' },
          { text: 'Extensibility', link: '/architecture/extensibility' },
          { text: 'Failure and Recovery', link: '/architecture/failure-and-recovery' },
        ],
      },
      {
        text: 'Operator Guides',
        collapsed: true,
        items: [
          { text: 'Installation', link: '/guides/operator/installation' },
          { text: 'Configuration', link: '/guides/operator/configuration' },
          { text: 'Monitoring', link: '/guides/operator/monitoring' },
          { text: 'Encryption', link: '/guides/operator/encryption' },
          { text: 'Workers and Scaling', link: '/guides/operator/workers-and-scaling' },
          { text: 'Service Bots', link: '/guides/operator/service-bots' },
          { text: 'Upgrading', link: '/guides/operator/upgrading' },
          { text: 'Hardening', link: '/guides/operator/hardening' },
        ],
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          { text: 'Bot Commands', link: '/reference/bot-commands' },
          { text: 'Event Types', link: '/reference/event-types' },
          { text: 'Provisioning API', link: '/reference/provisioning-api' },
          { text: 'Matrix Spec Map', link: '/reference/matrix-spec-map' },
        ],
      },
      {
        text: 'Troubleshooting',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/troubleshooting/' },
          { text: 'Webhooks Not Arriving', link: '/troubleshooting/webhooks-not-arriving' },
          { text: 'Authentication', link: '/troubleshooting/authentication' },
          { text: 'Connection Issues', link: '/troubleshooting/connection-issues' },
          { text: 'Common Errors', link: '/troubleshooting/common-errors' },
        ],
      },
      {
        text: 'Project',
        collapsed: true,
        items: [
          { text: 'Ecosystem', link: '/project/ecosystem' },
          { text: 'Roadmap', link: '/project/roadmap' },
          { text: 'Limitations', link: '/project/limitations' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yncyrydybyl/matrix-hookshot' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/yncyrydybyl/matrix-hookshot/edit/main/docs/:path',
    },

    outline: {
      level: [2, 3],
    },

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Originally by matrix-org. Fork maintained by yncyrydybyl.',
    },
  },

  // Allow dead links during migration — old docs reference pages not yet migrated
  ignoreDeadLinks: true,

  srcExclude: [
    'setup/**',
    'usage/**',
    'advanced/**',
    'dev/**',
    '_site/**',
    'hookshot.md',
    'setup.md',
    'metrics.md',
    'sentry.md',
    'troubleshooting.md',
    'SUMMARY.md',
  ],

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

})
