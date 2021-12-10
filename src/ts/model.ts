/**
 * GitHub page's url type.
 */
export enum URLType {
    USER = 'user',
    ORG = 'org',
    REPO = 'repo',
    OTHER = 'other',
}

/**
 * The information of current github page's url.
 */
export class URLInfo {
    public readonly authorURL: string = '';
    public readonly repoURL: string = '';
    public readonly eventAPI: string = '';
    constructor(
        public readonly type: URLType,
        public readonly author: string = '',
        public readonly repo: string = '',
    ) {
        switch (type) {
            case URLType.OTHER:
                return;
            case URLType.USER:
                this.authorURL = `https://github.com/${author}`;
                this.eventAPI = `https://api.github.com/users/${author}/events`;
                return;
            case URLType.ORG:
                this.authorURL = `https://github.com/${author}`;
                this.eventAPI = `https://api.github.com/orgs/${author}/events`;
                return;
            case URLType.REPO:
                this.authorURL = `https://github.com/${author}`;
                this.repoURL = `https://github.com/${author}/${repo}`;
                this.eventAPI = `https://api.github.com/repos/${author}/${repo}/events`;
                return;
        }
    }
}

/**
 * Github hovercard type, the string value will be used in "data-hovercard-type".
 */
export enum HoverCardType {
    User = 'user',
    Repo = 'repository',
    Commit = 'commit',
    Issue = 'issue',
    Pull = 'pull_request'
}

// ==================
// github api related
// ==================

/**
 * Dto returned from https://api.github.com/users/xxx.
 */
export interface UserInfo {
    login: string;
    name: string;
    publicRepos: number;
    totalPrivateRepos: number;
    ownedPrivateRepos: number;
    publicGists: number;
    privateGists: number;
    followers: number;
    following: number;
    createdAt: string;
}

/**
 * Dto returned from https://api.github.com/[users|repos|orgs]/xxx/events.
 */
export interface EventInfo {
    type: string;
    actor: Actor;
    repo: Repo;
    public: boolean;
    createdAt: string;
    payload: Payload;
}

export interface Actor {
    id: number;
    login: string;
    avatarUrl: string;
}

export interface Repo {
    id: number;
    name: string;
}

export interface Payload {
    size: number;
    commits: Commit[];
    ref: string;
    refType: string;
    description: string;
    action: string;
    member: User;
    issue: Issue;
    comment: Comment;
    forkee: Forkee;
    pullRequest: PullRequest;
    release: Release;
    pages: Page[];
}

export interface Commit {
    sha: string;
    message: string;
}

export interface User {
    id: number;
    login: string;
    htmlUrl: string;
}

export interface Issue {
    number: number;
    title: string;
    body: string;
    htmlUrl: string;
}

export interface Comment {
    body: string;
    commitId: string;
    htmlUrl: string;
}

export interface Forkee {
    fullName: string;
    owner: User;
    htmlUrl: string;
}

export interface PullRequest {
    number: number;
    title: string;
    body: string;
    htmlUrl: string;
}

export interface Release {
    tagName: string;
    name: string;
    body: string;
    htmlUrl: string;
}

export interface Page {
    action: string;
    sha: string;
    title: string;
    htmlUrl: string;
}
