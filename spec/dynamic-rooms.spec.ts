/**
 * Tests for the Dynamic Rooms onQueryRoom methods (GitHub).
 *
 * These tests verify that the onQueryRoom static methods on each GitHub
 * connection class correctly:
 *   - Fetch repo/issue/user data from GitHub API
 *   - Reject private repositories (security-critical)
 *   - Handle API errors gracefully
 *   - Return correct Matrix room creation parameters
 *   - Handle avatar fetch/upload failures appropriately
 *
 * Uses vitest (not mocha) because the project has a circular dependency
 * (GithubRepo -> BotCommands -> Connections/index -> SetupConnection ->
 * GithubRepo) that causes runtime errors under mocha/ts-node but is
 * handled by vite's module resolution.
 */
import { describe, test, expect, vi } from "vitest";

// Mock modules that cause circular dependency issues at import time.
// The chain is: GithubRepo -> BotCommands -> Connections/index ->
// SetupConnection -> GithubRepo (uses botCommandSymbol before init).
vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: Buffer.from("fake-image"),
      headers: { "content-type": "image/png" },
    }),
  },
}));

// Break the circular dependency by mocking the barrel import that
// BotCommands.ts uses. This prevents Connections/index.ts from loading
// SetupConnection which triggers the cycle.
vi.mock("../src/Connections", async () => {
  return {
    PermissionCheckFn: undefined,
  };
});

import {
  GitHubRepoConnection,
} from "../src/Connections/GithubRepo";
import { GitHubIssueConnection } from "../src/Connections/GithubIssue";
import { GitHubUserSpace } from "../src/Connections/GithubUserSpace";
import { GitHubDiscussionSpace } from "../src/Connections/GithubDiscussionSpace";
import { GithubInstance } from "../src/github/GithubInstance";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock GithubInstance whose getOctokitForRepo returns a fake Octokit
 * with configurable responses for repos.get, issues.get, and users.getByUsername.
 */
function createMockGithubInstance(overrides: {
  repoData?: Record<string, unknown>;
  issueData?: Record<string, unknown>;
  userData?: Record<string, unknown>;
  repoError?: Error;
  issueError?: Error;
  userError?: Error;
}) {
  const octokit = {
    repos: {
      get: async () => {
        if (overrides.repoError) throw overrides.repoError;
        return { data: overrides.repoData };
      },
    },
    issues: {
      get: async () => {
        if (overrides.issueError) throw overrides.issueError;
        return { data: overrides.issueData };
      },
    },
    users: {
      getByUsername: async () => {
        if (overrides.userError) throw overrides.userError;
        return { data: overrides.userData };
      },
    },
  };

  return {
    getOctokitForRepo: () => octokit,
  } as unknown as GithubInstance;
}

function createMockAppservice() {
  return {
    botIntent: { userId: "@bot:example.com" },
    botUserId: "@bot:example.com",
    botClient: {
      uploadContent: vi.fn().mockResolvedValue("mxc://example.com/avatar123"),
    },
    getIntentForUserId: () => ({
      userId: "@github:example.com",
      ensureJoined: vi.fn(),
      ensureRegistered: vi.fn(),
    }),
    isNamespacedUser: () => false,
  } as any;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PUBLIC_REPO = {
  full_name: "torvalds/linux",
  name: "linux",
  html_url: "https://github.com/torvalds/linux",
  url: "https://api.github.com/repos/torvalds/linux",
  description: "Linux kernel source tree",
  private: false,
  id: 2325298,
  owner: { login: "torvalds", id: 1024025 },
};

const PRIVATE_REPO = {
  ...PUBLIC_REPO,
  private: true,
};

const PUBLIC_ISSUE = {
  number: 42,
  title: "Fix null pointer dereference",
  state: "open",
  html_url: "https://github.com/torvalds/linux/issues/42",
  url: "https://api.github.com/repos/torvalds/linux/issues/42",
  repository: { full_name: "torvalds/linux" },
};

const USER_PROFILE = {
  login: "torvalds",
  name: "Linus Torvalds",
  avatar_url: "", // empty to skip avatar download in most tests
  node_id: "MDQ6VXNlcjEwMjQwMjU=",
  id: 1024025,
};

// ==========================================================================
// GitHubRepoConnection.onQueryRoom
// ==========================================================================
//
// WHY: This is the main code path for creating a dynamic room for a GitHub
// repository. It fetches repo metadata, checks if it's private, fetches
// the owner's avatar, and returns room creation parameters. Bugs here
// could leak private repo data into public Matrix rooms or create
// misconfigured rooms that don't receive webhook events.
// ==========================================================================

describe("GitHubRepoConnection.onQueryRoom", () => {
  function createOpts(
    overrides: Parameters<typeof createMockGithubInstance>[0],
  ) {
    return {
      as: createMockAppservice(),
      tokenStore: {} as any,
      commentProcessor: {} as any,
      messageClient: {} as any,
      githubInstance: createMockGithubInstance(overrides),
    };
  }

  // WHY: The happy path — a public repo should produce a room config with
  // correct name, topic, visibility, and connection state event. If this
  // fails, no dynamic repo rooms will work at all.
  test("should return correct room config for a public repo", async () => {
    const opts = createOpts({
      repoData: PUBLIC_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubRepoConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux:example.com",
    )!;

    const result = (await GitHubRepoConnection.onQueryRoom(
      match,
      opts,
    )) as any;

    expect(result.visibility).toBe("public");
    expect(result.preset).toBe("public_chat");
    // Room name should contain the full repo name and description
    expect(result.name).toContain("torvalds/linux");
    // Topic should be the repo URL
    expect(result.topic).toContain("https://github.com/torvalds/linux");
    // Connection state event must be set so webhooks get routed to this room
    const connState = result.initial_state[0];
    expect(connState.type).toBe(
      "uk.half-shot.matrix-hookshot.github.repository",
    );
    expect(connState.content.org).toBe("torvalds");
    expect(connState.content.repo).toBe("linux");
    expect(connState.state_key).toBe(PUBLIC_REPO.url);
  });

  // WHY: SECURITY — Private repositories must NEVER be bridged via dynamic
  // rooms. Anyone on any federated homeserver can query aliases, so bridging
  // a private repo would leak its contents to unauthorized users. This is
  // the most critical test in the suite.
  test("should reject private repositories", async () => {
    const opts = createOpts({
      repoData: PRIVATE_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubRepoConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux:example.com",
    )!;

    await expect(
      GitHubRepoConnection.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find repo");
  });

  // WHY: If the GitHub API is down or the repo doesn't exist, the error
  // should be caught and re-thrown as a clean error rather than crashing
  // the bridge process or leaking internal error details.
  test("should throw when repo fetch fails (404 / API down)", async () => {
    const opts = createOpts({
      repoError: new Error("Not Found"),
      userData: USER_PROFILE,
    });
    const match = GitHubRepoConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux:example.com",
    )!;

    await expect(
      GitHubRepoConnection.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find repo");
  });

  // WHY: Avatar failures currently crash room creation for repos. This
  // documents the current behavior. It's arguably a bug — a missing avatar
  // shouldn't prevent room creation — and this test will catch it if the
  // behavior is later changed to be non-fatal.
  test("should throw when avatar fetch fails (current behavior: fatal)", async () => {
    const opts = createOpts({
      repoData: PUBLIC_REPO,
      userError: new Error("User API failed"),
    });
    const match = GitHubRepoConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux:example.com",
    )!;

    await expect(
      GitHubRepoConnection.onQueryRoom(match, opts),
    ).rejects.toThrow("User API failed");
  });

  // WHY: When the user has no avatar_url (e.g., new GitHub account), the
  // room should still be created. The avatar state event should be undefined.
  test("should handle user with no avatar_url", async () => {
    const opts = createOpts({
      repoData: PUBLIC_REPO,
      userData: { ...USER_PROFILE, avatar_url: null },
    });
    const match = GitHubRepoConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux:example.com",
    )!;

    const result = (await GitHubRepoConnection.onQueryRoom(
      match,
      opts,
    )) as any;

    expect(result.visibility).toBe("public");
    // No avatar state should be set
    expect(result.initial_state[1]).toBeUndefined();
  });
});

// ==========================================================================
// GitHubIssueConnection.onQueryRoom
// ==========================================================================
//
// WHY: Issue rooms bridge a specific GitHub issue/PR into a Matrix room.
// The room must contain the correct issue number, title, and state in its
// connection state. The comments_processed field must be set to -1 to
// trigger a full comment backfill when the connection is instantiated.
// A wrong issue number or missing backfill trigger means users get an
// empty or incorrect room.
// ==========================================================================

describe("GitHubIssueConnection.onQueryRoom", () => {
  function createOpts(
    overrides: Parameters<typeof createMockGithubInstance>[0],
  ) {
    return {
      as: createMockAppservice(),
      tokenStore: {} as any,
      commentProcessor: {} as any,
      messageClient: {} as any,
      githubInstance: createMockGithubInstance(overrides),
    };
  }

  // WHY: Happy path — verify the room gets the right name (includes issue
  // number and title), topic (includes state and URL), and connection state
  // (issue number as string, comments_processed = -1 for backfill).
  test("should return correct room config for an issue", async () => {
    const opts = createOpts({
      issueData: PUBLIC_ISSUE,
      repoData: PUBLIC_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubIssueConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux_42:example.com",
    )!;

    const result = (await GitHubIssueConnection.onQueryRoom(
      match,
      opts,
    )) as any;

    expect(result.visibility).toBe("public");
    expect(result.preset).toBe("public_chat");
    // Room name should contain the issue number
    expect(result.name).toContain("42");
    // Topic should contain issue state and URL
    expect(result.topic).toContain("open");
    expect(result.topic).toContain(
      "https://github.com/torvalds/linux/issues/42",
    );
    // Connection state must include the issue number as a string
    const connState = result.initial_state[0];
    expect(connState.type).toBe(
      "uk.half-shot.matrix-hookshot.github.issue",
    );
    expect(connState.content.issues).toEqual(["42"]);
    // comments_processed = -1 triggers full comment backfill
    expect(connState.content.comments_processed).toBe(-1);
    expect(connState.state_key).toBe(PUBLIC_ISSUE.url);
  });

  // WHY: SECURITY — same as repo: issues in private repos must never be
  // bridged. Leaking a private issue could expose security vulnerabilities,
  // unreleased features, or confidential discussions.
  test("should reject issues in private repositories", async () => {
    const opts = createOpts({
      issueData: PUBLIC_ISSUE,
      repoData: PRIVATE_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubIssueConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux_42:example.com",
    )!;

    await expect(
      GitHubIssueConnection.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find issue");
  });

  // WHY: If the issue doesn't exist (deleted, wrong number), the bridge
  // should return a clear error rather than creating an empty room that
  // never receives events.
  test("should throw when issue fetch fails", async () => {
    const opts = createOpts({
      issueError: new Error("Not Found"),
      repoData: PUBLIC_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubIssueConnection.QueryRoomRegex.exec(
      "#github_torvalds_linux_42:example.com",
    )!;

    await expect(
      GitHubIssueConnection.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find issue");
  });
});

// ==========================================================================
// GitHubUserSpace.onQueryRoom
// ==========================================================================
//
// WHY: User spaces are Matrix spaces (m.space) that aggregate all of a
// GitHub user's repos and discussions. Unlike regular rooms, they need:
//   - creation_content.type = "m.space"
//   - Restricted power levels (only bot can add children)
//   - world_readable history for federation
//   - Username lowercased for consistent alias lookup
// If any of these are wrong, the space won't work correctly as a container
// for child rooms, or federated users won't be able to browse it.
// ==========================================================================

describe("GitHubUserSpace.onQueryRoom", () => {
  function createOpts(
    overrides: Parameters<typeof createMockGithubInstance>[0],
  ) {
    return {
      as: createMockAppservice(),
      githubInstance: createMockGithubInstance(overrides),
    };
  }

  // WHY: Verify the full space configuration — m.space type, restrictive
  // power levels, world_readable visibility, and correct room name/topic.
  test("should return correct space config for a user", async () => {
    const opts = createOpts({ userData: USER_PROFILE });
    const match = GitHubUserSpace.QueryRoomRegex.exec(
      "#github_torvalds:example.com",
    )!;

    const result = await GitHubUserSpace.onQueryRoom(match, opts);

    expect(result.visibility).toBe("public");
    expect(result.preset).toBe("public_chat");
    // Must be created as a space, not a regular room
    expect(result.creation_content).toEqual({ type: "m.space" });
    // Name should contain the display name and username
    expect(result.name).toContain("torvalds");
    // Power levels should prevent non-bot users from posting
    const powerLevels = result.power_level_content_override as any;
    expect(powerLevels.events_default).toBe(50);
    expect(powerLevels.state_default).toBe(100);
    // History visibility must be world_readable for federation browsing
    const historyState = (result.initial_state as any[]).find(
      (s: any) => s?.type === "m.room.history_visibility",
    );
    expect(historyState.content.history_visibility).toBe("world_readable");
  });

  // WHY: GitHub usernames are case-insensitive but Matrix aliases are not.
  // Lowercasing ensures that #github_Torvalds and #github_torvalds resolve
  // to the same room instead of creating duplicates.
  test("should lowercase the username in state and alias", async () => {
    const opts = createOpts({
      userData: { ...USER_PROFILE, login: "Torvalds" },
    });
    const match = GitHubUserSpace.QueryRoomRegex.exec(
      "#github_Torvalds:example.com",
    )!;

    const result = await GitHubUserSpace.onQueryRoom(match, opts);

    expect(result.room_alias_name).toBe("github_torvalds");
    expect(result.topic).toContain("torvalds");
  });

  // WHY: Unlike repo/issue rooms where avatar failure is fatal, user spaces
  // gracefully handle it. This test verifies that inconsistency — and
  // proves that spaces are more resilient. If the behavior of repo rooms is
  // later fixed to match, this test documents the expected behavior.
  test("should still create room when avatar fetch fails (non-fatal)", async () => {
    const as = createMockAppservice();
    as.botClient.uploadContent = vi
      .fn()
      .mockRejectedValue(new Error("Upload failed"));
    const githubInstance = createMockGithubInstance({
      userData: {
        ...USER_PROFILE,
        avatar_url: "https://example.com/avatar.png",
      },
    });

    const match = GitHubUserSpace.QueryRoomRegex.exec(
      "#github_torvalds:example.com",
    )!;

    // Should NOT throw — room creation succeeds without avatar
    const result = await GitHubUserSpace.onQueryRoom(match, {
      as,
      githubInstance,
    });
    expect(result.visibility).toBe("public");
  });

  // WHY: If the GitHub user doesn't exist, the bridge should throw a clear
  // error rather than creating a broken empty space.
  test("should throw when user fetch fails", async () => {
    const opts = createOpts({
      userError: new Error("Not Found"),
    });
    const match = GitHubUserSpace.QueryRoomRegex.exec(
      "#github_nonexistent:example.com",
    )!;

    await expect(
      GitHubUserSpace.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find repo");
  });
});

// ==========================================================================
// GitHubDiscussionSpace.onQueryRoom
// ==========================================================================
//
// WHY: Discussion spaces are Matrix spaces scoped to a specific repo's
// GitHub Discussions. They have the same space requirements as user spaces,
// plus they need the private repo security check. The alias must use the
// `disc_` prefix to avoid collisions with repo room aliases.
// ==========================================================================

describe("GitHubDiscussionSpace.onQueryRoom", () => {
  function createOpts(
    overrides: Parameters<typeof createMockGithubInstance>[0],
  ) {
    return {
      as: createMockAppservice(),
      githubInstance: createMockGithubInstance(overrides),
    };
  }

  // WHY: Verify the full space config — m.space type, correct owner/repo
  // in state (lowercased), and the disc_ prefix in the alias.
  test("should return correct space config for a discussion space", async () => {
    const opts = createOpts({
      repoData: PUBLIC_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubDiscussionSpace.QueryRoomRegex.exec(
      "#github_disc_torvalds_linux:example.com",
    )!;

    const result = await GitHubDiscussionSpace.onQueryRoom(match, opts);

    expect(result.visibility).toBe("public");
    expect(result.creation_content).toEqual({ type: "m.space" });
    expect(result.name).toContain("Discussions");
    expect(result.room_alias_name).toBe("github_disc_torvalds_linux");
    // Connection state should use lowercased owner/repo
    const connState = (result.initial_state as any[])[0];
    expect(connState.content.owner).toBe("torvalds");
    expect(connState.content.repo).toBe("linux");
  });

  // WHY: SECURITY — private repo discussions must never be bridged. Same
  // reasoning as repo and issue rooms.
  test("should reject private repositories", async () => {
    const opts = createOpts({
      repoData: PRIVATE_REPO,
      userData: USER_PROFILE,
    });
    const match = GitHubDiscussionSpace.QueryRoomRegex.exec(
      "#github_disc_torvalds_linux:example.com",
    )!;

    await expect(
      GitHubDiscussionSpace.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find repo");
  });

  // WHY: Like user spaces, discussion spaces should handle avatar failures
  // gracefully. The room should be created without an avatar rather than
  // failing entirely.
  test("should still create room when avatar fetch fails (non-fatal)", async () => {
    const opts = createOpts({
      repoData: PUBLIC_REPO,
      userError: new Error("Avatar API failed"),
    });
    const match = GitHubDiscussionSpace.QueryRoomRegex.exec(
      "#github_disc_torvalds_linux:example.com",
    )!;

    const result = await GitHubDiscussionSpace.onQueryRoom(match, opts);
    expect(result.visibility).toBe("public");
  });

  // WHY: If the repo doesn't exist, creation must fail cleanly with an
  // error rather than creating a broken space.
  test("should throw when repo fetch fails", async () => {
    const opts = createOpts({
      repoError: new Error("Not Found"),
      userData: USER_PROFILE,
    });
    const match = GitHubDiscussionSpace.QueryRoomRegex.exec(
      "#github_disc_torvalds_linux:example.com",
    )!;

    await expect(
      GitHubDiscussionSpace.onQueryRoom(match, opts),
    ).rejects.toThrow("Could not find repo");
  });
});
