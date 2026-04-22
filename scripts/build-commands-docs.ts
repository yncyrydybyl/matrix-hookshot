/**
 * Extracts @botCommand metadata from connection classes and generates
 * a markdown reference page.
 *
 * Usage: ts-node scripts/build-commands-docs.ts > docs/reference/bot-commands.md
 *
 * Follows the same pattern as build-metrics-docs.ts.
 *
 * Note: Some connection classes have circular dependencies that prevent
 * clean import. This script imports what it can and documents the rest
 * from the AdminRoom which aggregates most commands.
 */

import "reflect-metadata";
import { BotCommands } from "../src/BotCommands";
import prettier from "prettier";

// AdminRoom imports cleanly and contains admin/notification/setup commands
import { AdminRoom } from "../src/AdminRoom";

interface SourceConfig {
  title: string;
  prefix: string;
  commands: BotCommands;
}

const sources: SourceConfig[] = [];

// AdminRoom compiles its own commands at module level
const adminCommands = (
  AdminRoom as unknown as { botCommands: BotCommands }
).botCommands;
if (adminCommands && Object.keys(adminCommands).length > 0) {
  sources.push({
    title: "Admin Commands (DM with bot)",
    prefix: "!hookshot",
    commands: adminCommands,
  });
}

// Try importing connection classes individually
// These may fail due to circular dependencies
const connectionImports: {
  path: string;
  exportName: string;
  title: string;
  prefix: string;
}[] = [
  {
    path: "../src/Connections/GithubRepo",
    exportName: "GitHubRepoConnection",
    title: "GitHub Repository Commands",
    prefix: "!gh",
  },
  {
    path: "../src/Connections/GitlabRepo",
    exportName: "GitLabRepoConnection",
    title: "GitLab Repository Commands",
    prefix: "!gl",
  },
  {
    path: "../src/Connections/JiraProject",
    exportName: "JiraProjectConnection",
    title: "JIRA Project Commands",
    prefix: "!jira",
  },
  {
    path: "../src/Connections/OpenProjectConnection",
    exportName: "OpenProjectConnection",
    title: "OpenProject Commands",
    prefix: "!op",
  },
];

for (const ci of connectionImports) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(ci.path);
    const cls = mod[ci.exportName];
    if (cls?.botCommands && Object.keys(cls.botCommands).length > 0) {
      sources.push({
        title: ci.title,
        prefix: ci.prefix,
        commands: cls.botCommands,
      });
    }
  } catch {
    // Connection class has circular deps — add a note instead
    sources.push({
      title: ci.title,
      prefix: ci.prefix,
      commands: {},
    });
  }
}

let totalCommands = 0;
let output = `---
title: Bot Commands Reference
description: Complete reference of all hookshot bot commands
audience: [user, operator]
generated_from: "scripts/build-commands-docs.ts"
---

# Bot Commands Reference

This page is auto-generated from \`@botCommand\` decorators in the source code.

To regenerate: \`ts-node scripts/build-commands-docs.ts > docs/reference/bot-commands.md\`

`;

const summaryCounts: { title: string; count: number }[] = [];

for (const source of sources) {
  const entries = Object.entries(source.commands);
  if (entries.length === 0) {
    output += `## ${source.title}\n\n`;
    output += `Prefix: \`${source.prefix}\`\n\n`;
    output += `> Commands could not be auto-extracted due to module dependencies. See source code for the full list.\n\n`;
    continue;
  }

  totalCommands += entries.length;
  summaryCounts.push({ title: source.title, count: entries.length });

  output += `## ${source.title}\n\n`;
  output += `Prefix: \`${source.prefix}\`\n\n`;
  output += `| Command | Required args | Optional args | Description |\n`;
  output += `|---------|---------------|---------------|-------------|\n`;

  for (const [prefix, cmd] of entries) {
    const required =
      cmd.requiredArgs?.map((a) => `\`<${a}>\``).join(" ") || "—";
    const optional =
      cmd.optionalArgs?.map((a) => `\`[${a}]\``).join(" ") || "—";
    output += `| \`${source.prefix} ${prefix}\` | ${required} | ${optional} | ${cmd.help} |\n`;
  }
  output += "\n";
}

output += `## Summary\n\n`;
output += `Total auto-extracted commands: **${totalCommands}**\n\n`;
if (summaryCounts.length > 0) {
  output += `| Source | Count |\n`;
  output += `|--------|-------|\n`;
  for (const entry of summaryCounts) {
    output += `| ${entry.title} | ${entry.count} |\n`;
  }
}

prettier
  .format(output, { parser: "markdown" })
  .then((s: string) => process.stdout.write(s));
