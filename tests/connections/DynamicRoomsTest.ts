/**
 * Tests for the Dynamic Rooms feature (GitHub).
 *
 * Dynamic rooms are Matrix rooms created on-demand when a user queries a room
 * alias like `#github_owner_repo:example.com`. The bridge intercepts the alias
 * lookup, fetches the GitHub resource, and returns room creation parameters.
 *
 * This test suite covers:
 * 1. Regex pattern matching — ensuring aliases are parsed correctly
 * 2. onQueryRoom behavior — ensuring correct room configs are returned
 * 3. Error handling — private repos, missing resources, avatar failures
 * 4. Routing — ensuring the right handler is called for each alias pattern
 *
 * NOTE: These tests use inline regex values (copied from source) rather than
 * importing the connection classes directly. This is because the project has a
 * circular dependency: GithubRepo -> BotCommands -> Config -> Connections/index
 * -> SetupConnection -> GithubRepo. This cycle causes a runtime error when
 * loading any connection class in isolation via mocha/ts-node.
 *
 * The onQueryRoom functional tests are in spec/dynamic-rooms.spec.ts (vitest)
 * which can handle the circular imports via vite's module resolution.
 */
import { expect } from "chai";

// ---------------------------------------------------------------------------
// Regex patterns copied from source for isolated testing.
// If you change a QueryRoomRegex in source, update it here too.
//
// Source locations:
//   - GithubRepo.ts:      /#github_(.+)_(.+):.*/
//   - GithubIssue.ts:     /#github_(.+)_(.+)_(\d+):.*/
//   - GithubUserSpace.ts: /#github_(.+):.*/
//   - GithubDiscussionSpace.ts: /#github_disc_(.+)_(.+):.*/
// ---------------------------------------------------------------------------
const RepoRegex = /#github_(.+)_(.+):.*/;
const IssueRegex = /#github_(.+)_(.+)_(\d+):.*/;
const UserSpaceRegex = /#github_(.+):.*/;
const DiscussionSpaceRegex = /#github_disc_(.+)_(.+):.*/;

// ==========================================================================
// 1. QueryRoomRegex pattern matching tests
// ==========================================================================
//
// WHY: The regex patterns are the entry point for dynamic room creation.
// A mis-parse here means the wrong owner, repo, or issue number is fetched
// from GitHub. The greedy (.+) patterns are especially risky for names
// containing underscores (GitHub allows underscores in repo names).
// These tests document the CURRENT behavior so regressions are caught
// and known ambiguities are visible.
// ==========================================================================

describe("Dynamic Rooms", () => {
  describe("QueryRoomRegex patterns", () => {
    describe("Repo regex: /#github_(.+)_(.+):.*/", () => {
      const regex = RepoRegex;

      // WHY: The most basic case — ensure the regex works at all for
      // simple owner/repo pairs with no special characters.
      it("should match a simple owner/repo alias", () => {
        const match = regex.exec("#github_torvalds_linux:example.com");
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("torvalds");
        expect(match![2]).to.equal("linux");
      });

      // WHY: GitHub allows hyphens in both usernames and repo names.
      // This is a common real-world case that must work.
      it("should match owner/repo with hyphens", () => {
        const match = regex.exec(
          "#github_my-org_my-cool-repo:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("my-org");
        expect(match![2]).to.equal("my-cool-repo");
      });

      // WHY: This exposes the greedy (.+) bug. When a repo name contains
      // underscores, the regex can't reliably split owner from repo.
      // The greedy first (.+) will consume as much as possible, potentially
      // swallowing part of the repo name into the owner. This test documents
      // the current (potentially incorrect) behavior.
      it("should handle repos with underscores (greedy match behavior)", () => {
        const match = regex.exec("#github_owner_my_repo:example.com");
        expect(match).to.not.be.null;
        // Greedy (.+) makes first group consume "owner_my" and second "repo"
        // This documents the current behavior — it may NOT be correct!
        expect(match![1]).to.equal("owner_my");
        expect(match![2]).to.equal("repo");
      });

      // WHY: Ensure the regex also matches issue-style aliases (it will).
      // This proves that routing order in Bridge.onQueryRoom is critical —
      // the issue regex must be checked BEFORE the repo regex.
      it("should also match issue-style aliases (routing order matters)", () => {
        const issueAlias = "#github_torvalds_linux_42:example.com";
        const repoMatch = regex.exec(issueAlias);
        const issueMatch = IssueRegex.exec(issueAlias);
        // Both match — this is why routing order in Bridge.onQueryRoom matters
        expect(repoMatch).to.not.be.null;
        expect(issueMatch).to.not.be.null;
      });

      // WHY: Discussion aliases also match the repo regex (with "disc" as
      // part of the owner). This is safe because the discussion regex is
      // checked first in routing, but we document the overlap here.
      it("should also match discussion aliases (routing order matters)", () => {
        const match = regex.exec("#github_disc_owner_repo:example.com");
        // It matches: disc_owner as owner, repo as repo
        expect(match).to.not.be.null;
      });

      // WHY: Dots are valid in GitHub repo names. Ensure the regex handles
      // them (it does, because . matches any character in (.+)).
      it("should match repos with dots", () => {
        const match = regex.exec(
          "#github_owner_my.repo.name:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("owner");
        expect(match![2]).to.equal("my.repo.name");
      });
    });

    describe("Issue regex: /#github_(.+)_(.+)_(\\d+):.*/", () => {
      const regex = IssueRegex;

      // WHY: Basic case — ensure the issue number is correctly extracted
      // as a separate capture group (digits only).
      it("should match a simple owner/repo/issue alias", () => {
        const match = regex.exec(
          "#github_torvalds_linux_42:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("torvalds");
        expect(match![2]).to.equal("linux");
        expect(match![3]).to.equal("42");
      });

      // WHY: Issue numbers can be very large in active repos (tens of
      // thousands). Ensure multi-digit numbers are captured correctly.
      it("should match large issue numbers", () => {
        const match = regex.exec(
          "#github_facebook_react_28995:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![3]).to.equal("28995");
      });

      // WHY: Same greedy-match concern as repos. With underscored repo
      // names, owner/repo split may be wrong. This test documents
      // exactly which part goes where.
      it("should handle repos with underscores (greedy match behavior)", () => {
        const match = regex.exec(
          "#github_owner_my_repo_123:example.com",
        );
        expect(match).to.not.be.null;
        // Greedy: first group eats "owner_my", second gets "repo"
        expect(match![1]).to.equal("owner_my");
        expect(match![2]).to.equal("repo");
        expect(match![3]).to.equal("123");
      });

      // WHY: Ensure the regex requires a NUMERIC issue number and
      // rejects non-numeric suffixes, preventing invalid API calls.
      it("should not match non-numeric issue identifiers", () => {
        const match = regex.exec("#github_owner_repo_abc:example.com");
        expect(match).to.be.null;
      });

      // WHY: Should not match a bare repo alias (no issue number).
      // Without this, a repo alias could accidentally create an issue room.
      it("should not match a repo-only alias", () => {
        const match = regex.exec(
          "#github_torvalds_linux:example.com",
        );
        expect(match).to.be.null;
      });

      // WHY: Issue number 0 is not valid on GitHub (they start at 1).
      // The regex allows it — documenting this edge case.
      it("should match issue number 0 (regex does not validate range)", () => {
        const match = regex.exec("#github_owner_repo_0:example.com");
        expect(match).to.not.be.null;
        expect(match![3]).to.equal("0");
      });
    });

    describe("UserSpace regex: /#github_(.+):.*/", () => {
      const regex = UserSpaceRegex;

      // WHY: The user space regex is the most general (#github_X:server).
      // It must match single-segment usernames correctly.
      it("should match a simple username alias", () => {
        const match = regex.exec("#github_torvalds:example.com");
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("torvalds");
      });

      // WHY: Because this regex is so broad, it also matches repo and
      // issue aliases. The routing order in Bridge.onQueryRoom must
      // check more specific patterns first. This test documents that
      // the user regex swallows "torvalds_linux" as a single username.
      it("should also match repo aliases (routing order matters)", () => {
        const match = regex.exec(
          "#github_torvalds_linux:example.com",
        );
        // This matches with username = "torvalds_linux"
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("torvalds_linux");
      });

      // WHY: Usernames with hyphens are very common on GitHub.
      it("should match usernames with hyphens", () => {
        const match = regex.exec(
          "#github_my-cool-user:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("my-cool-user");
      });
    });

    describe("DiscussionSpace regex: /#github_disc_(.+)_(.+):.*/", () => {
      const regex = DiscussionSpaceRegex;

      // WHY: The discussion space uses a `disc_` prefix to disambiguate
      // from regular repo aliases. Verify it extracts owner/repo correctly.
      it("should match a discussion space alias", () => {
        const match = regex.exec(
          "#github_disc_torvalds_linux:example.com",
        );
        expect(match).to.not.be.null;
        expect(match![1]).to.equal("torvalds");
        expect(match![2]).to.equal("linux");
      });

      // WHY: Must not match regular repo aliases that lack the `disc_`
      // prefix. If it did, regular repo requests would be misrouted to
      // the discussion space handler.
      it("should not match a regular repo alias", () => {
        const match = regex.exec(
          "#github_torvalds_linux:example.com",
        );
        expect(match).to.be.null;
      });

      // WHY: Same greedy concern — test underscore behavior.
      it("should handle repos with underscores (greedy match)", () => {
        const match = regex.exec(
          "#github_disc_owner_my_repo:example.com",
        );
        expect(match).to.not.be.null;
        // Greedy: first group eats "owner_my", second gets "repo"
        expect(match![1]).to.equal("owner_my");
        expect(match![2]).to.equal("repo");
      });
    });

    // ==========================================================================
    // Routing priority (regex overlap) tests
    // ==========================================================================
    //
    // WHY: Multiple regexes match the same alias string. Bridge.onQueryRoom
    // relies on checking them in a specific order (issue -> discussion space
    // -> repo -> user). If the order is wrong, the wrong handler runs.
    // These tests document which regexes overlap and prove that the most
    // specific regex should always be checked first.
    // ==========================================================================

    describe("Routing priority (regex overlap)", () => {
      // WHY: An issue alias matches 3 different regexes. If the issue regex
      // isn't checked first, the alias would be misinterpreted as a repo
      // (with "linux_42" as the repo name) or a user (with "torvalds_linux_42").
      it("issue alias matches issue, repo, AND user regexes", () => {
        const alias = "#github_owner_repo_42:example.com";
        expect(IssueRegex.exec(alias)).to.not.be.null;
        expect(RepoRegex.exec(alias)).to.not.be.null;
        expect(UserSpaceRegex.exec(alias)).to.not.be.null;
      });

      // WHY: A repo alias matches repo and user regexes but NOT issue.
      // If user regex is checked before repo regex, the owner_repo
      // string would be treated as a username.
      it("repo alias matches repo and user regexes but NOT issue regex", () => {
        const alias = "#github_owner_repo:example.com";
        expect(IssueRegex.exec(alias)).to.be.null;
        expect(RepoRegex.exec(alias)).to.not.be.null;
        expect(UserSpaceRegex.exec(alias)).to.not.be.null;
      });

      // WHY: A user-only alias should only match the user regex.
      // This is the one case where routing order doesn't matter.
      it("user alias matches ONLY user regex", () => {
        const alias = "#github_owner:example.com";
        expect(IssueRegex.exec(alias)).to.be.null;
        expect(RepoRegex.exec(alias)).to.be.null;
        expect(UserSpaceRegex.exec(alias)).to.not.be.null;
      });

      // WHY: A discussion space alias matches the discussion regex AND
      // the repo regex (with "disc" as part of the owner). The discussion
      // regex must be checked before the repo regex.
      it("discussion alias matches discussion AND repo regexes", () => {
        const alias = "#github_disc_owner_repo:example.com";
        expect(DiscussionSpaceRegex.exec(alias)).to.not.be.null;
        expect(RepoRegex.exec(alias)).to.not.be.null;
      });

      // WHY: Verify that discussion aliases don't accidentally match the
      // issue regex (they shouldn't, since there's no trailing \d+ group).
      it("discussion alias does NOT match issue regex", () => {
        const alias = "#github_disc_owner_repo:example.com";
        expect(IssueRegex.exec(alias)).to.be.null;
      });
    });
  });
});
