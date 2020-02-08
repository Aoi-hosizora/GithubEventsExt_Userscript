export enum UrlType {
    User = 'user',
    Org = 'org',
    Repo = 'repo'
}

export enum Hovercard {
    User = 'user',
    Repo = 'repository',
    Commit = 'commit',
    Issue = 'issue',
    Pull = 'pull_request'
}

/**
 * document.URL parse result
 */
export class UrlInfo {
    public authorUrl: string;
    public repoUrl: string;
    public apiUrl: string;
    constructor(
        public type: UrlType,
        public author: string,
        public repo: string = ''
    ) {
        this.authorUrl = `https://github.com/${author}`;
        this.repoUrl = `https://github.com/${author}/${repo}/${name}`;

        let endpoint: string;
        if (this.type === UrlType.Repo) {
            endpoint = `${author}/${repo}`;
        } else {
            endpoint = author;
        }
        this.apiUrl = `https://api.github.com/${this.type.toString()}s/${endpoint}/events`;
    }
}

/**
 * github api parse result
 */
export interface GithubInfo {
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
