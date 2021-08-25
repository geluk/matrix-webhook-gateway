import { is } from 'typescript-is';
import {
  a, blockquote, br, brace, code, fmt, preview, quote, truncate,
} from '../../src/formatting/formatting';
import { WebhookContext, WebhookMessage, WebhookPlugin } from '../../src/pluginApi/v2';

interface IssueOpened {
  secret: string,
  action: 'opened',
  number: number,
  issue: Issue,
  repository: Repository,
  sender: User,
}

interface IssueClosed {
  secret: string,
  action: 'closed',
  number: number,
  issue: Issue,
  repository: Repository,
  sender: User,
}

interface IssueAssigned {
  secret: string,
  action: 'assigned',
  number: number,
  issue: Issue,
  repository: Repository,
  sender: User,
}

interface PullRequestOpened {
  secret: string,
  action: 'opened',
  number: number,
  pull_request: PullRequest,
  repository: Repository,
  sender: User,
  review: unknown,
}

interface PullRequestPushed {
  secret: string,
  action: 'synchronized',
  number: number,
  pull_request: PullRequest,
  repository: Repository,
  sender: User,
  review: unknown,
}

interface PullRequestClosed {
  secret: string,
  action: 'closed',
  number: number,
  pull_request: PullRequest,
  repository: Repository,
  sender: User,
}

interface CommentCreated {
  secret: string,
  action: 'created',
  issue: Issue,
  comment: Comment,
  repository: Repository,
  sender: User,
}

interface CommentEdited {
  secret: string,
  action: 'edited',
  number: number,
  changes: unknown,
  issue: Issue,
  comment: Comment,
  repository: Repository,
  sender: User,
}

interface CommentDeleted {
  secret: string,
  action: 'deleted',
  issue: Issue,
  comment: Comment,
  repository: Repository,
  sender: User,
}

interface ChangesPushed {
  secret: string,
  ref: string,
  before: string,
  after: string,
  compare_url: string,
  commits: Commit[],
  head_commit: unknown,
  repository: Repository,
  pusher: User,
  sender: User,
}

interface Issue {
  id: number,
  url: string,
  html_url: string,
  number: number,
  user: User,
  original_author: string,
  original_author_id: number,
  title: string,
  body: string,
  ref: string,
  labels: Label[],
  milestone: unknown,
  assignee: User | null,
  assignees: User[] | null,
  state: string,
  is_locked: boolean,
  comments: number,
  created_at: string,
  updated_at: string,
  closed_at: string | null,
  due_date: string | null,
  pull_request: unknown,
  repository: {
    id: number,
    name: string,
    owner: string,
    full_name: string,
  },
}

interface PullRequest {
  id: number,
  url: string,
  number: number,
  user: User,
  title: string,
  body: string,
  labels: Label[],
  milestone: unknown,
  assignee: User | null,
  assignees: User[] | null,
  state: string,
  is_locked: boolean,
  comments: number,
  html_url: string,
  diff_url: string,
  patch_url: string,
  mergeable: boolean,
  merged: boolean,
  merged_at: string | null,
  merge_commit_sha: string | null,
  merged_by: User | null,
  base: Ref,
  head: Ref,
  merge_base: string,
  due_date: string | null,
  created_at: string,
  updated_at: string,
  closed_at: string | null,
}

interface Repository {
  id: number,
  owner: User,
  name: string,
  full_name: string,
  description: string,
  empty: boolean,
  private: boolean,
  fork: boolean,
  template: boolean,
  parent: unknown,
  mirror: boolean,
  size: number,
  html_url: string,
  ssh_url: string,
  clone_url: string,
  original_url: string,
  website: string,
  stars_count: number,
  forks_count: number,
  watchers_count: number,
  open_issues_count: number,
  open_pr_counter: number,
  release_counter: number,
  default_branch: string,
  archived: boolean,
  created_at: string,
  updated_at: string,
  permissions: {
    admin: boolean,
    push: boolean,
    pull: boolean,
  },
  has_issues: boolean,
  internal_tracker: {
    enable_time_tracker: boolean,
    allow_only_contributors_to_track_time: boolean,
    enable_issue_dependencies: boolean,
  },
  has_wiki: boolean,
  has_pull_requests: boolean,
  has_projects: boolean,
  ignore_whitespace_conflicts: boolean,
  allow_merge_commits: boolean,
  allow_rebase: boolean,
  allow_rebase_explicit: boolean,
  allow_squash_merge: boolean,
  avatar_url: string,
  internal: boolean,
  mirror_interval: string,
}

interface User {
  id: number,
  login: string,
  full_name: string,
  email: string,
  avatar_url: string,
  language: string,
  is_admin: boolean,
  last_login: string,
  created: string,
  restricted: boolean,
  username: string
}

interface Comment {
  id: number,
  html_url: string,
  pull_request_url: string,
  issue_url: string,
  user: User,
  original_author: string,
  original_author_id: number,
  body: string,
  created_at: string,
  updated_at: string,
}

interface Commit {
  id: string,
  message: string,
  url: string,
  author: Author,
  committer: Author,
  verification: unknown,
  timestamp: string,
  added: unknown,
  removed: unknown,
  modified: unknown,
}

interface Ref {
  label: string,
  ref: string,
  sha: string,
  repo_id: number,
  repo: Repository,
}

interface Author {
  name: string,
  email: string,
  username: string,
}

interface Label {
  id: number,
  name: string,
  color: string,
  description: string,
  url: string,
}

const plugin: WebhookPlugin = {
  format: 'gitea',
  version: '2',
  async init(context: WebhookContext) {
  },
  async transform(body: any, context: WebhookContext): Promise<WebhookMessage | undefined> {
    if (is<IssueOpened>(body)) {
      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' created a new issue in ',
          a(body.repository.html_url, body.repository.full_name),
          ': "',
          a(body.issue.html_url, body.issue.title),
          '"',
          ` (#${body.issue.number})`,
        ),
      };
    }
    if (is<PullRequestOpened>(body)) {
      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' opened a new pull request in ',
          a(body.repository.html_url, body.repository.full_name),
          ': "',
          a(body.pull_request.html_url, body.pull_request.title),
          '"',
          ` (#${body.pull_request.number})`,
        ),
      };
    }
    if (is<PullRequestPushed>(body)) {
      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' pushed new changes to "',
          a(body.pull_request.html_url, body.pull_request.title),
          `" (#${body.pull_request.number})`,
          ' in ',
          a(body.repository.html_url, body.repository.full_name),
        ),
      };
    }
    if (is<IssueClosed>(body)) {
      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' closed "',
          a(body.issue.html_url, body.issue.title),
          `" (#${body.issue.number})`,
          ' in ',
          a(body.repository.html_url, body.repository.full_name),
        ),
      };
    }
    if (is<PullRequestClosed>(body)) {
      if(body.pull_request.merged) {
        return {
          version: '2',
          text: fmt(
            body.sender.username,
            ' merged "',
            a(body.pull_request.html_url, body.pull_request.title),
            `" (#${body.pull_request.number})`,
            ' in ',
            a(body.repository.html_url, body.repository.full_name),
          ),
        };
      } else {
        return {
          version: '2',
          text: fmt(
            body.sender.username,
            ' closed "',
            a(body.pull_request.html_url, body.pull_request.title),
            `" (#${body.pull_request.number})`,
            ' in ',
            a(body.repository.html_url, body.repository.full_name),
          ),
        };
      }
    }
    if (is<CommentCreated>(body)) {
      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' commented on "',
          a(body.comment.html_url, body.issue.title),
          `" (#${body.issue.number})`,
          ' in ',
          a(body.repository.html_url, body.repository.full_name),
          ':', br(),
          blockquote(preview(200, body.comment.body)),
        ),
      };
    }
    if (is<ChangesPushed>(body)) {
      let matchedAfter = body.commits.find(c => c.id === body.after) as Commit | undefined;
      let matchedBefore = body.commits.find(c => c.id === body.before) as Commit | undefined;

      let fmtCommit = (commit: Commit) => fmt(
        code(a(commit.url, truncate(8, commit.id))),
        ' ',
        (quote(preview(80, commit.message.trim()))),
      );

      let fmtUnknown = (id: string) => fmt(
        code(a(`${body.repository.html_url}/commit/${id}`, truncate(8, id))),
      )

      let fmtAfter = matchedAfter ? fmtCommit(matchedAfter) : fmtUnknown(body.after);
      let fmtBefore = matchedBefore ? fmtCommit(matchedBefore) : fmtUnknown(body.before);

      let ref = body.ref;
      if (ref.startsWith('refs/heads/')) {
        ref = ref.substring('refs/heads/'.length);
      }

      return {
        version: '2',
        text: fmt(
          body.sender.username,
          ' pushed ',
          code(ref),
          ' in ',
          a(body.repository.html_url, body.repository.full_name),
          ' from ',
          fmtBefore,
          ' to ',
          fmtAfter,
          ' ',
          brace(a(body.compare_url, 'compare')),
        ),
      };
    }
    if (is<CommentEdited | CommentDeleted | IssueAssigned>(body)) {
      context.logger.info(`Ignoring Gitea action: ${body.action}`);
      return undefined;
    }
    context.logger.info(`Unknown Gitea action: '${body.action}'`);
    return undefined;
  },
};

export default plugin;
