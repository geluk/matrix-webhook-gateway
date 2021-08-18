import { is } from 'typescript-is';
import {
  a, blockquote, br, fmt, truncate,
} from '../../src/formatting/formatting';
import { WebhookContextV2, WebhookMessageV2, WebhookPluginV2 } from '../../src/webhooks/pluginApi';

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
  labels: unknown[],
  milestone: unknown,
  assignee: unknown,
  assignees: unknown,
  state: string,
  is_locked: boolean,
  comments: number,
  created_at: string,
  updated_at: string,
  closed_at: unknown,
  due_date: unknown,
  pull_request: unknown,
  repository: {
    id: number,
    name: string,
    owner: string,
    full_name: string,
  },
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

const plugin: WebhookPluginV2 = {
  format: 'gitea',
  version: '2',
  init() { },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(body: any, context: WebhookContextV2): WebhookMessageV2 | undefined {
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
          blockquote(truncate(200, body.comment.body)),
        ),
      };
    }
    if (is<CommentEdited | CommentDeleted>(body)) {
      context.logger.info(`Ignoring Gitea action: ${body.action}`);
      return undefined;
    }
    context.logger.info(`Unknown Gitea action: '${body.action}'`);
    return undefined;
  },
};

export default plugin;
