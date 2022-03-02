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
 * The information of current GitHub page's url.
 */
export class URLInfo {
    public readonly authorURL: string = '';
    public readonly repoURL: string = '';
    public readonly eventAPI: string = '';
    constructor(
        public readonly type: URLType,
        public readonly author: string = '',
        public readonly repo: string = '',
        public readonly extra: ExtraURLInfo = {},
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

export interface ExtraURLInfo {
    user?: { isMe: boolean; };
    repo?: { isTree: boolean; ref: string; path: string; };
}

/**
 * GitHub hovercard type, the string value will be used in "data-hovercard-type".
 */
export enum HoverCardType {
    USER = 'user',
    REPO = 'repository',
    COMMIT = 'commit',
    ISSUE = 'issue',
    PULL = 'pull_request'
}

// ==================
// GitHub api related
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
 * Dto returned from https://api.github.com/repos/xxx/xxx.
 */
export interface RepoInfo {
    name: string;
    fullName: string;
    private: boolean;
    createdAt: string;
    size: number;
    stargazersCount: number;
    watcherCount: number;
    language: string;
    forksCount: number;
    defaultBranch: string;
}

/**
 * Dto returned from https://api.github.com/[users|repos|orgs]/xxx/events.
 */
export interface EventInfo {
    type: string;
    actor: {
        id: number;
        login: string;
        avatarUrl: string;
    };
    repo: {
        id: number;
        name: string;
    };
    public: boolean;
    createdAt: string;
    payload: Payload;
}

/**
 * Payload dto returned in EventInfo.
 */
export interface Payload {
    size: number;
    commits: {
        sha: string;
        message: string;
    }[];
    ref: string;
    refType: string;
    description: string;
    action: string;
    member: {
        id: number;
        login: string;
        htmlUrl: string;
    };
    issue: {
        number: number;
        title: string;
        body: string;
        htmlUrl: string;
    };
    comment: {
        body: string;
        commitId: string;
        htmlUrl: string;
    };
    forkee: {
        fullName: string;
        owner: {
            id: number;
            login: string;
            htmlUrl: string;
        };
        htmlUrl: string;
    };
    pullRequest: {
        number: number;
        title: string;
        body: string;
        htmlUrl: string;
    };
    release: {
        tagName: string;
        name: string;
        body: string;
        htmlUrl: string;
    };
    pages: {
        action: string;
        sha: string;
        title: string;
        htmlUrl: string;
    }[];
}

/**
 * Dto returned from https://api.github.com/repos/xxx/xxx/contents?ref=xxx
 */
export interface RepoContentItem {
    name: string;
    path: string;
    size: number;
    type: string;
}
