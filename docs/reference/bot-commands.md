---
title: Bot Commands Reference
description: Complete reference of all hookshot bot commands
audience: [user, operator]
generated_from: "scripts/build-commands-docs.ts"
---

# Bot Commands Reference

This page is auto-generated from `@botCommand` decorators in the source code.

To regenerate: `ts-node scripts/build-commands-docs.ts > docs/reference/bot-commands.md`

## Admin Commands (DM with bot)

Prefix: `!hookshot`

| Command                                               | Required args                    | Optional args     | Description                                                                                  |
| ----------------------------------------------------- | -------------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `!hookshot help`                                      | —                                | —                 | This help text                                                                               |
| `!hookshot disconnect`                                | `<roomId>` `<id>`                | —                 | Remove a connection                                                                          |
| `!hookshot github notifications toggle`               | —                                | —                 | Toggle enabling/disabling GitHub notifications in this room                                  |
| `!hookshot github notifications filter participating` | —                                | —                 | Toggle enabling/disabling GitHub notifications in this room                                  |
| `!hookshot github notifications`                      | —                                | —                 | Show the current notification settings                                                       |
| `!hookshot github list-connections`                   | —                                | —                 | List currently bridged Github rooms                                                          |
| `!hookshot github project list-for-user`              | —                                | `[user]` `[repo]` | List GitHub projects for a user                                                              |
| `!hookshot github project list-for-org`               | `<org>`                          | `[repo]`          | List GitHub projects for an org                                                              |
| `!hookshot github project open`                       | `<projectId>`                    | —                 | Open a GitHub project as a room                                                              |
| `!hookshot github discussion open`                    | `<owner>` `<repo>` `<number>`    | —                 | Open a discussion room                                                                       |
| `!hookshot gitlab open issue`                         | `<url>`                          | —                 | Open or join a issue room for GitLab                                                         |
| `!hookshot gitlab personaltoken`                      | `<instanceName>` `<accessToken>` | —                 | Set your personal access token for GitLab                                                    |
| `!hookshot gitlab hastoken`                           | `<instanceName>`                 | —                 | Check if you have a token stored for GitLab                                                  |
| `!hookshot filters list`                              | —                                | —                 | List your saved filters                                                                      |
| `!hookshot filters set`                               | `<name>` `<...parameters>`       | —                 | Create (or update) a filter. You can use 'orgs:', 'users:' or 'repos:' as filter parameters. |
| `!hookshot filters notifications toggle`              | `<name>`                         | —                 | Apply a filter as a whitelist to your notifications                                          |
| `!hookshot github login`                              | —                                | —                 | Log in to GitHub                                                                             |
| `!hookshot github setpersonaltoken`                   | `<accessToken>`                  | —                 | Set your personal access token for GitHub                                                    |
| `!hookshot github status`                             | —                                | —                 | Check the status of your GitHub authentication                                               |
| `!hookshot jira login`                                | —                                | —                 | Log in to JIRA                                                                               |
| `!hookshot jira logout`                               | —                                | —                 | Clear any login information                                                                  |
| `!hookshot jira whoami`                               | —                                | —                 | Determine JIRA identity                                                                      |
| `!hookshot openproject login`                         | —                                | —                 | Log in to OpenProject                                                                        |
| `!hookshot openproject logout`                        | —                                | —                 | Log out of OpenProject                                                                       |

## GitHub Repository Commands

Prefix: `!gh`

| Command            | Required args | Optional args              | Description                                                                                                            |
| ------------------ | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `!gh create`       | `<title>`     | `[description]` `[labels]` | Create an issue for this repo                                                                                          |
| `!gh assign`       | —             | `[number]` `[...users]`    | Assign an issue to a user. If `number` is ommitted, the latest issue is used. If `users` is omitted, you are assigned. |
| `!gh close`        | `<number>`    | `[comment]`                | Close an issue                                                                                                         |
| `!gh workflow run` | `<name>`      | `[args]` `[ref]`           | Run a GitHub Actions workflow. Args should be specified in "key=value,key2='value 2'" format.                          |
| `!gh help`         | —             | —                          | This help text                                                                                                         |

## GitLab Repository Commands

Prefix: `!gl`

| Command                   | Required args | Optional args              | Description                              |
| ------------------------- | ------------- | -------------------------- | ---------------------------------------- |
| `!gl create`              | `<title>`     | `[description]` `[labels]` | Create an issue for this repo            |
| `!gl create-confidential` | `<title>`     | `[description]` `[labels]` | Create a confidental issue for this repo |
| `!gl close`               | `<number>`    | `[comment]`                | Close an issue                           |
| `!gl help`                | —             | —                          | This help text                           |

## JIRA Project Commands

Prefix: `!jira`

| Command             | Required args         | Optional args              | Description                      |
| ------------------- | --------------------- | -------------------------- | -------------------------------- |
| `!jira create`      | `<type>` `<title>`    | `[description]` `[labels]` | Create an issue for this project |
| `!jira issue-types` | —                     | —                          | Get issue types for this project |
| `!jira assign`      | `<issueKey>` `<user>` | —                          | Assign an issue to a user        |
| `!jira help`        | —                     | —                          | This help text                   |

## OpenProject Commands

Prefix: `!op`

| Command           | Required args        | Optional args                         | Description                                                         |
| ----------------- | -------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `!op create`      | `<type>` `<subject>` | `[description]`                       | Create a new work package                                           |
| `!op close`       | —                    | `[workPackageId]` `[description]`     | Close a work package                                                |
| `!op priority`    | —                    | `[workPackageId]` `[priority]`        | Set the priority for a work package                                 |
| `!op assign`      | —                    | `[workPackageId]` `[assignee]`        | Assign a work package to a new user (use 'unset' to remove)         |
| `!op responsible` | —                    | `[workPackageId]` `[responsibleUser]` | Assign a responsible user to a work package (use 'unset' to remove) |
| `!op help`        | —                    | —                                     | This help text                                                      |

## Summary

Total auto-extracted commands: **43**

| Source                       | Count |
| ---------------------------- | ----- |
| Admin Commands (DM with bot) | 24    |
| GitHub Repository Commands   | 5     |
| GitLab Repository Commands   | 4     |
| JIRA Project Commands        | 4     |
| OpenProject Commands         | 6     |
