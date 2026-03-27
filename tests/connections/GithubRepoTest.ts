import {
  GitHubRepoConnection,
  GitHubRepoConnectionState,
} from "../../src/Connections/GithubRepo";
import { GithubInstance } from "../../src/github/GithubInstance";
import { createMessageQueue } from "../../src/messageQueue";
import { UserTokenStore } from "../../src/tokens/UserTokenStore";
import { DefaultConfig } from "../../src/config/Defaults";
import { AppserviceMock } from "../utils/AppserviceMock";
import { ApiError, ErrCode, ValidatorApiError } from "../../src/api";
import { expect } from "chai";
import { IntentMock } from "../utils/IntentMock";

const ROOM_ID = "!foo:bar";

const GITHUB_ORG_REPO = {
  org: "a-fake-org",
  repo: "a-fake-repo",
};

const GITHUB_ISSUE = {
  id: 1234,
  number: 1234,
  user: {
    login: "alice",
  },
  html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/issues/1234`,
  title: "My issue",
  assignees: [],
};

const GITHUB_REPO = {
  full_name: `${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}`,
  id: 1234,
  html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}`,
};

const ISSUE_42 = {
  id: 42,
  number: 42,
  user: { login: "neo" },
  html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/issues/42`,
  title: "The answer to life, the universe and everything",
  assignees: [],
};

const GITHUB_ISSUE_CREATED_PAYLOAD = {
  action: "opened",
  issue: GITHUB_ISSUE,
  repository: {
    full_name: `${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}`,
    id: 1234,
    html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}`,
  },
};

function createConnection(
  state: Record<string, unknown> = {},
  isExistingState = false,
) {
  const mq = createMessageQueue();
  mq.subscribe("*");
  const as = AppserviceMock.create();
  const intent = as.getIntentForUserId("@github:example.test");
  const githubInstance = new GithubInstance(
    "foo",
    "bar",
    new URL("https://github.com"),
  );
  const connection = new GitHubRepoConnection(
    ROOM_ID,
    as,
    intent,
    GitHubRepoConnection.validateState(
      {
        org: "a-fake-org",
        repo: "a-fake-repo",
        ...state,
      },
      isExistingState,
    ),
    {} as UserTokenStore,
    "state_key",
    githubInstance,
    // Default config always contains GitHub
    DefaultConfig.github!,
  );
  return { connection, intent: intent as IntentMock };
}

describe("GitHubRepoConnection", () => {
  describe("validateState", () => {
    it("can validate a completes state config", () => {
      GitHubRepoConnection.validateState({
        org: "foo",
        repo: "bar",
        enableHooks: ["issue", "pull_request", "release"],
        commandPrefix: "!foo",
        showIssueRoomLink: true,
        prDiff: {
          enabled: true,
          maxLines: 55,
        },
        includingLabels: ["this", "and", "that"],
        excludingLabels: ["not", "those"],
        hotlinkIssues: {
          prefix: "foo",
        },
        newIssue: {
          labels: ["this", "and", "that"],
        },
      } as GitHubRepoConnectionState as unknown as Record<string, unknown>);
    });

    it("will convert ignoredHooks for existing state", () => {
      const state = GitHubRepoConnection.validateState(
        {
          org: "foo",
          repo: "bar",
          ignoreHooks: ["issue"],
          enableHooks: ["issue", "pull_request", "release"],
          commandPrefix: "!foo",
        } as GitHubRepoConnectionState as unknown as Record<string, unknown>,
        true,
      );
      expect(state.enableHooks).to.not.contain("issue");
    });

    it("will disallow invalid state", () => {
      try {
        GitHubRepoConnection.validateState({
          org: "foo",
          repo: false,
        });
      } catch (ex) {
        if (
          ex instanceof ValidatorApiError === false ||
          ex.errcode !== ErrCode.BadValue
        ) {
          throw ex;
        }
      }
    });

    it("will disallow enabledHooks to contains invalid enums if this is new state", () => {
      try {
        GitHubRepoConnection.validateState(
          {
            org: "foo",
            repo: "bar",
            enabledHooks: ["not-real"],
          },
          false,
        );
      } catch (ex) {
        if (
          ex instanceof ApiError === false ||
          ex.errcode !== ErrCode.BadValue
        ) {
          throw ex;
        }
      }
    });

    it("will allow enabledHooks to contains invalid enums if this is old state", () => {
      GitHubRepoConnection.validateState(
        {
          org: "foo",
          repo: "bar",
          enabledHooks: ["not-real"],
        },
        true,
      );
    });
  });

  describe("onIssueCommentCreated", () => {
    const GITHUB_COMMENT_PAYLOAD = {
      action: "created" as const,
      comment: {
        user: { login: "morpheus" },
        body: "There is no spoon",
        html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/issues/42#issuecomment-1`,
      },
      issue: ISSUE_42,
      repository: GITHUB_REPO,
    };

    it("will handle a simple comment", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
      });
      await connection.onIssueCommentCreated(GITHUB_COMMENT_PAYLOAD as never);
      intent.expectEventBodyContains("**morpheus** [commented]", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#42`, 0);
      intent.expectEventBodyContains("There is no spoon", 0);
    });

    it("will truncate long comments", async () => {
      const longBody = "DON'T PANIC ".repeat(50);
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
      });
      await connection.onIssueCommentCreated({
        ...GITHUB_COMMENT_PAYLOAD,
        comment: { ...GITHUB_COMMENT_PAYLOAD.comment, body: longBody },
      } as never);
      const body = intent.sentEvents[0].content.body;
      expect(body).to.contain("…");
      expect(body.length).to.be.lessThan(longBody.length);
    });

    it("will not truncate comments at exactly 256 chars", async () => {
      const exactBody = "b".repeat(256);
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
      });
      await connection.onIssueCommentCreated({
        ...GITHUB_COMMENT_PAYLOAD,
        comment: { ...GITHUB_COMMENT_PAYLOAD.comment, body: exactBody },
      } as never);
      const body = intent.sentEvents[0].content.body;
      expect(body).to.contain("b".repeat(256));
      expect(body).to.not.contain("…");
    });

    it("will filter out comments on issues not matching includingLabels", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
        includingLabels: ["red-pill"],
      });
      await connection.onIssueCommentCreated({
        ...GITHUB_COMMENT_PAYLOAD,
        issue: { ...ISSUE_42, labels: [{ name: "blue-pill" }] },
      } as never);
      intent.expectNoEvent();
    });

    it("will filter out comments on issues matching excludingLabels", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
        excludingLabels: ["mostly-harmless"],
      });
      await connection.onIssueCommentCreated({
        ...GITHUB_COMMENT_PAYLOAD,
        issue: { ...ISSUE_42, labels: [{ name: "mostly-harmless" }] },
      } as never);
      intent.expectNoEvent();
    });

    it("will include comments on issues matching includingLabels", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["issue.comment.created", "issue.comment"],
        includingLabels: ["red-pill"],
      });
      await connection.onIssueCommentCreated({
        ...GITHUB_COMMENT_PAYLOAD,
        issue: { ...ISSUE_42, labels: [{ name: "red-pill" }] },
      } as never);
      intent.expectEventBodyContains("**morpheus** [commented]", 0);
    });

    it("will skip when issue.comment hook is disabled", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["issue"],
      });
      await connection.onIssueCommentCreated(GITHUB_COMMENT_PAYLOAD as never);
      intent.expectNoEvent();
    });
  });

  describe("onIssueEdited", () => {
    it("will handle an issue edit", async () => {
      const { connection, intent } = createConnection();
      await connection.onIssueEdited({
        action: "edited", issue: ISSUE_42,
        sender: { login: "trillian" }, repository: GITHUB_REPO, changes: {},
      } as never);
      intent.expectEventBodyContains("**trillian** edited issue", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#42`, 0);
      intent.expectEventBodyContains("The answer to life, the universe and everything", 0);
    });

    it("will skip when issue.edited hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["pull_request"] });
      await connection.onIssueEdited({
        action: "edited", issue: ISSUE_42,
        sender: { login: "trillian" }, repository: GITHUB_REPO, changes: {},
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onIssueStateChange", () => {
    it("will handle an issue being closed", async () => {
      const { connection, intent } = createConnection();
      await connection.onIssueStateChange({
        action: "closed", issue: { ...ISSUE_42, state: "closed" },
        sender: { login: "agentsmith" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**agentsmith** closed issue", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#42`, 0);
    });

    it("will handle an issue being reopened", async () => {
      const { connection, intent } = createConnection();
      await connection.onIssueStateChange({
        action: "reopened", issue: { ...ISSUE_42, state: "open" },
        sender: { login: "neo" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**neo** reopened issue", 0);
    });

    it("will skip when issue.changed hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["pull_request"] });
      await connection.onIssueStateChange({
        action: "closed", issue: { ...ISSUE_42, state: "closed" },
        sender: { login: "agentsmith" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onPROpened", () => {
    const NEBUCHADNEZZAR_PR = {
      id: 42, number: 42,
      title: "Upgrade the Nebuchadnezzar hovercraft systems",
      html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/pull/42`,
      diff_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/pull/42.diff`,
      user: { login: "trinity" }, draft: false, labels: [],
    };

    it("will handle a simple PR opened", async () => {
      const { connection, intent } = createConnection();
      await connection.onPROpened({
        action: "opened", pull_request: NEBUCHADNEZZAR_PR,
        sender: { login: "trinity" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**trinity** opened a new PR", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#42`, 0);
      intent.expectEventBodyContains("Upgrade the Nebuchadnezzar hovercraft systems", 0);
    });

    it("will handle a draft PR", async () => {
      const { connection, intent } = createConnection();
      await connection.onPROpened({
        action: "opened", pull_request: { ...NEBUCHADNEZZAR_PR, draft: true },
        sender: { login: "trinity" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**trinity** drafted a new PR", 0);
    });

    it("will filter out PRs not matching includingLabels", async () => {
      const { connection, intent } = createConnection({ includingLabels: ["zion-approved"] });
      await connection.onPROpened({
        action: "opened",
        pull_request: { ...NEBUCHADNEZZAR_PR, labels: [{ name: "machine-city" }] },
        sender: { login: "trinity" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });

    it("will skip when pull_request.opened hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onPROpened({
        action: "opened", pull_request: NEBUCHADNEZZAR_PR,
        sender: { login: "trinity" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onPRReadyForReview", () => {
    const HEART_OF_GOLD_PR = {
      id: 1337, number: 1337,
      title: "Install infinite improbability drive",
      html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/pull/1337`,
      user: { login: "zaphod" }, labels: [],
    };

    it("will handle a PR marked ready for review", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRReadyForReview({
        action: "ready_for_review", pull_request: HEART_OF_GOLD_PR,
        sender: { login: "zaphod" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**zaphod** has marked", 0);
      intent.expectEventBodyContains("as ready to review", 0);
      intent.expectEventBodyContains("Install infinite improbability drive", 0);
    });

    it("will skip when pull_request.ready_for_review hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onPRReadyForReview({
        action: "ready_for_review", pull_request: HEART_OF_GOLD_PR,
        sender: { login: "zaphod" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onPRReviewed", () => {
    const VOGON_PR = {
      id: 42, number: 42, title: "Demolish Earth for hyperspace bypass",
      html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/pull/42`,
      user: { login: "prostetnic-vogon-jeltz" }, labels: [],
    };

    it("will handle an approved review", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRReviewed({
        action: "submitted", pull_request: VOGON_PR,
        review: { state: "approved" },
        sender: { login: "ford-prefect" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**ford-prefect** approved", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#42`, 0);
    });

    it("will handle a changes_requested review", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRReviewed({
        action: "submitted", pull_request: VOGON_PR,
        review: { state: "changes_requested" },
        sender: { login: "arthur-dent" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**arthur-dent** changes_requested", 0);
    });

    it("will skip a commented review", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRReviewed({
        action: "submitted", pull_request: VOGON_PR,
        review: { state: "commented" },
        sender: { login: "marvin" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onPRClosed", () => {
    const ORACLE_PR = {
      id: 101, number: 101, title: "Rebalance the equation of the One",
      html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/pull/101`,
      user: { login: "the-oracle" }, labels: [],
    };

    it("will handle a merged PR", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRClosed({
        action: "closed", pull_request: { ...ORACLE_PR, merged: true },
        sender: { login: "neo" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**neo** merged PR", 0);
      intent.expectEventBodyContains(`${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}#101`, 0);
    });

    it("will handle a closed (not merged) PR", async () => {
      const { connection, intent } = createConnection();
      await connection.onPRClosed({
        action: "closed", pull_request: { ...ORACLE_PR, merged: false },
        sender: { login: "agentsmith" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**agentsmith** closed PR", 0);
    });

    it("will skip when pull_request.closed hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onPRClosed({
        action: "closed", pull_request: { ...ORACLE_PR, merged: true },
        sender: { login: "neo" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onReleaseCreated", () => {
    it("will handle a release with a name", async () => {
      const { connection, intent } = createConnection();
      await connection.onReleaseCreated({
        action: "published",
        release: {
          tag_name: "v42.0.0", name: "The Hitchhiker's Release",
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/releases/tag/v42.0.0`,
          body: "So long, and thanks for all the fish", draft: false,
        },
        sender: { login: "slartibartfast" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**slartibartfast** released", 0);
      intent.expectEventBodyContains("The Hitchhiker's Release", 0);
      intent.expectEventBodyContains("So long, and thanks for all the fish", 0);
    });

    it("will fall back to tag_name when name is null", async () => {
      const { connection, intent } = createConnection();
      await connection.onReleaseCreated({
        action: "published",
        release: {
          tag_name: "v0.0.42", name: null,
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/releases/tag/v0.0.42`,
          body: "", draft: false,
        },
        sender: { login: "deep-thought" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("v0.0.42", 0);
    });

    it("will skip when release hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onReleaseCreated({
        action: "published",
        release: {
          tag_name: "v42.0.0", name: "The Hitchhiker's Release",
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/releases/tag/v42.0.0`,
          body: "", draft: false,
        },
        sender: { login: "slartibartfast" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onReleaseDrafted", () => {
    it("will handle a drafted release", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["release", "release.drafted"],
      });
      await connection.onReleaseDrafted({
        action: "created",
        release: {
          tag_name: "v42.0.0-rc1", name: "Mostly Harmless Beta",
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/releases/tag/v42.0.0-rc1`,
          body: "Time is an illusion. Lunchtime doubly so.", draft: true,
        },
        sender: { login: "ford-prefect" }, repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**ford-prefect** drafted release", 0);
      intent.expectEventBodyContains("Mostly Harmless Beta", 0);
      intent.expectEventBodyContains("Time is an illusion. Lunchtime doubly so.", 0);
    });

    it("will skip non-draft releases", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["release", "release.drafted"],
      });
      await connection.onReleaseDrafted({
        action: "created",
        release: {
          tag_name: "v42.0.0", name: "The Hitchhiker's Release",
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/releases/tag/v42.0.0`,
          body: "", draft: false,
        },
        sender: { login: "slartibartfast" }, repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onWorkflowCompleted", () => {
    function makeWorkflowEvent(conclusion: string, branch = "construct", workflowName = "Matrix Simulation") {
      return {
        action: "completed",
        workflow_run: {
          id: 1999, conclusion, head_branch: branch,
          html_url: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/actions/runs/1999`,
          name: workflowName,
        },
        workflow: { name: workflowName },
        sender: { login: "the-architect" }, repository: GITHUB_REPO,
      };
    }

    it("will handle a successful workflow", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.success"],
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success") as never);
      intent.expectEventBodyContains("completed successfully", 0);
      intent.expectEventBodyContains("Matrix Simulation", 0);
    });

    it("will handle a failed workflow", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.failure"],
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("failure") as never);
      intent.expectEventBodyContains("failed", 0);
    });

    it("will handle a cancelled workflow", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.cancelled"],
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("cancelled") as never);
      intent.expectEventBodyContains("was cancelled", 0);
    });

    it("will handle a timed out workflow", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.timed_out"],
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("timed_out") as never);
      intent.expectEventBodyContains("timed out", 0);
    });

    it("will filter by matching branch", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.success"],
        workflowRun: { matchingBranch: "^construct$" },
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success", "training-dojo") as never);
      intent.expectNoEvent();
    });

    it("will allow matching branch", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.success"],
        workflowRun: { matchingBranch: "^construct$" },
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success", "construct") as never);
      intent.expectEventBodyContains("completed successfully", 0);
    });

    it("will filter by excluding workflows", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.success"],
        workflowRun: { excludingWorkflows: ["Vogon Poetry Recital"] },
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success", "construct", "Vogon Poetry Recital") as never);
      intent.expectNoEvent();
    });

    it("will filter by including workflows", async () => {
      const { connection, intent } = createConnection({
        enableHooks: ["workflow", "workflow.run", "workflow.run.success"],
        workflowRun: { includingWorkflows: ["Matrix Simulation"] },
      });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success", "construct", "Babel Fish Deploy") as never);
      intent.expectNoEvent();
    });

    it("will skip when workflow hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onWorkflowCompleted(makeWorkflowEvent("success") as never);
      intent.expectNoEvent();
    });
  });

  describe("onPush", () => {
    it("will handle a push with multiple commits", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["push"] });
      await connection.onPush({
        sender: { login: "tank" },
        commits: [{ id: "aaa111" }, { id: "bbb222" }, { id: "ccc333" }],
        compare: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/compare/aaa...ccc`,
        ref: "refs/heads/zion-mainframe", base_ref: null,
        pusher: { name: "tank", email: "tank@nebuchadnezzar.ship" },
        repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("**tank** pushed", 0);
      intent.expectEventBodyContains("3 commits", 0);
      intent.expectEventBodyContains("`refs/heads/zion-mainframe`", 0);
    });

    it("will handle a push with a single commit", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["push"] });
      await connection.onPush({
        sender: { login: "marvin" },
        commits: [{ id: "42abcd" }],
        compare: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/compare/41...42`,
        ref: "refs/heads/paranoid-android", base_ref: null,
        pusher: { name: "marvin", email: "marvin@sirius-cybernetics.corp" },
        repository: GITHUB_REPO,
      } as never);
      intent.expectEventBodyContains("1 commit", 0);
      expect(intent.sentEvents[0].content.body).to.not.contain("1 commits");
    });

    it("will skip when push hook is disabled", async () => {
      const { connection, intent } = createConnection({ enableHooks: ["issue"] });
      await connection.onPush({
        sender: { login: "marvin" },
        commits: [{ id: "42abcd" }],
        compare: `https://github.com/${GITHUB_ORG_REPO.org}/${GITHUB_ORG_REPO.repo}/compare/41...42`,
        ref: "refs/heads/paranoid-android", base_ref: null,
        pusher: { name: "marvin", email: "marvin@sirius-cybernetics.corp" },
        repository: GITHUB_REPO,
      } as never);
      intent.expectNoEvent();
    });
  });

  describe("onIssueCreated", () => {
    it("will handle a simple issue", async () => {
      const { connection, intent } = createConnection();
      await connection.onIssueCreated(GITHUB_ISSUE_CREATED_PAYLOAD as never);
      // Statement text.
      intent.expectEventBodyContains("**alice** created new issue", 0);
      intent.expectEventBodyContains(
        GITHUB_ISSUE_CREATED_PAYLOAD.issue.html_url,
        0,
      );
      intent.expectEventBodyContains(
        GITHUB_ISSUE_CREATED_PAYLOAD.issue.title,
        0,
      );
    });

    it("will handle assignees on issue creation", async () => {
      const { connection, intent } = createConnection();
      await connection.onIssueCreated({
        ...GITHUB_ISSUE_CREATED_PAYLOAD,
        issue: {
          ...GITHUB_ISSUE,
          assignees: [{ login: "alice" }, { login: "bob" }],
        },
      } as never);
      // Statement text.
      intent.expectEventBodyContains("**alice** created new issue", 0);
      intent.expectEventBodyContains('"My issue" assigned to alice, bob', 0);
      intent.expectEventBodyContains(
        GITHUB_ISSUE_CREATED_PAYLOAD.issue.html_url,
        0,
      );
      intent.expectEventBodyContains(
        GITHUB_ISSUE_CREATED_PAYLOAD.issue.title,
        0,
      );
    });

    it("will filter out issues not matching includingLabels.", async () => {
      const { connection, intent } = createConnection({
        includingLabels: ["include-me"],
      });
      await connection.onIssueCreated({
        ...GITHUB_ISSUE_CREATED_PAYLOAD,
        issue: {
          ...GITHUB_ISSUE,
          labels: [
            {
              name: "foo",
            },
          ],
        },
      } as never);
      // ..or issues with no labels
      await connection.onIssueCreated(GITHUB_ISSUE_CREATED_PAYLOAD as never);
      intent.expectNoEvent();
    });

    it("will filter out issues matching excludingLabels.", async () => {
      const { connection, intent } = createConnection({
        excludingLabels: ["exclude-me"],
      });
      await connection.onIssueCreated({
        ...GITHUB_ISSUE_CREATED_PAYLOAD,
        issue: {
          ...GITHUB_ISSUE,
          labels: [
            {
              name: "exclude-me",
            },
          ],
        },
      } as never);
      intent.expectNoEvent();
    });

    it("will include issues matching includingLabels.", async () => {
      const { connection, intent } = createConnection({
        includingIssues: ["include-me"],
      });
      await connection.onIssueCreated({
        ...GITHUB_ISSUE_CREATED_PAYLOAD,
        issue: {
          ...GITHUB_ISSUE,
          labels: [
            {
              name: "include-me",
            },
          ],
        },
      } as never);
      intent.expectEventBodyContains("**alice** created new issue", 0);
    });
  });
});
