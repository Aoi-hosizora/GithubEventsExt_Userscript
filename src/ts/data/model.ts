// ===========
// url related
// ===========

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
    public readonly dataAPI: string = '';
    public readonly eventAPI: string = '';
    public readonly extra: {
        user?: { isMe: boolean; };
        repo?: { isTree: boolean; ref: string; path: string; };
    } = {};

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
                this.dataAPI = `https://api.github.com/users/${author}`;
                this.eventAPI = `https://api.github.com/users/${author}/events`;
                return;
            case URLType.ORG:
                this.authorURL = `https://github.com/${author}`;
                this.dataAPI = `https://api.github.com/orgs/${author}`;
                this.eventAPI = `https://api.github.com/orgs/${author}/events`;
                return;
            case URLType.REPO:
                this.authorURL = `https://github.com/${author}`;
                this.repoURL = `https://github.com/${author}/${repo}`;
                this.dataAPI = `https://api.github.com/repos/${author}/${repo}`;
                this.eventAPI = `https://api.github.com/repos/${author}/${repo}/events`;
                return;
        }
    }

    public equals(o: URLInfo): boolean {
        return o.type == this.type && o.author == this.author && o.repo == this.repo;
    }
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

/**
 * Repo contents size related data.
 */
export interface RepoSizeData {
    cache: Map<string, number> | undefined;
    ref: string;
    truncated: boolean;
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
 * Dto returned from https://api.github.com/orgs/xxx.
 */
export interface OrgInfo {
    login: string;
    name: string;
    publicRepos: number;
    totalPrivateRepos: number;
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
 * Dto returned from https://api.github.com/repos/xxx/xxx/contents?ref=xxx
 */
export interface RepoContentInfo {
    name: string;
    path: string;
    size: number;
    type: string;
}

/**
 * Dto returned from https://api.github.com/repos/xxx/xxx/git/trees/xxx
 */
export interface RepoTreeInfo {
    truncated: boolean;
    tree: {
        path: string;
        type: string;
        size: number;
    }[];
}

// ========================
// GitHub event api related
// ========================

/**
 * Dto returned from https://api.github.com/[users|repos|orgs]/xxx/events.
 */
export interface EventInfo {
    type: string;
    type2: string;
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
        stateReason: string | null;
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
        mergedAt: string | null;
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
