import moment from 'moment';
import { EventInfo, HoverCardType } from '@src/ts/model';

// ===================
// format info related
// ===================

/**
 * Format RepoInfo to <li> string.
 */
export function formatInfoToLi(item: EventInfo): string {
    const body = formatInfoToBody(item);
    if (!body) {
        return "";
    }
    const userUrl = `https://github.com/${item.actor.login}`;
    const userHovercard = hovercard(HoverCardType.USER, `/hovercards?user_id=${item.actor.id}`);
    const createAt = moment(new Date(item.createdAt));
    const displayCreateAt = createAt.format('YY/MM/DD HH:mm:ss');
    const fullCreateAt = `${createAt.format('YYYY/MM/DD dddd, HH:mm:ss')} (${createAt.fromNow()})`;
    return `
        <li>
            <div class="ah-content-header">
                <div class="ah-content-header-user">
                    <a href="${userUrl}" target="_blank" style="text-decoration:none" ${userHovercard}>
                        <img class="ah-content-header-avatar ah-content-header-icon" src="${item.actor.avatarUrl}" alt="" />
                    </a>
                    <span class="ah-content-header-link">
                        <a href="${userUrl}" target="_blank" ${userHovercard}>${item.actor.login}</a>
                    </span>
                    <span class="ah-content-header-event ah-content-header-icon" title="${item.type}">${getSvgTag(item.type)}</span>
                </div>
                <div class="ah-content-header-info">
                    <span class="ah-content-header-time" title="${fullCreateAt}">${displayCreateAt}</span>
                    ${item.public ? '' : '<span class="ah-content-header-private" title="This is a private event">Private</span>'}
                </div>
            </div>
            <div class="ah-content-body">
                ${body}
            </div>
        </li>
    `;
}

/**
 * Format RepoInfo to tags that will be put inside body <div>.
 */
function formatInfoToBody(data: EventInfo): string {
    const pl = data.payload;
    const repoUrl = `http://github.com/${data.repo.name}`;
    const repoA = a(data.repo.name, repoUrl, HoverCardType.REPO, `/${data.repo.name}/hovercard`);
    switch (data.type) {
        case 'PushEvent':
            const branch = pl.ref.split('/').slice(2).join('/');
            const branchA = a(branch, `${repoUrl}/tree/${branch}`);
            const commitsCount = pl.size > 1 ? `${pl.size} commits` : '1 commit';
            let commits = '';
            pl.commits.forEach(item => commits += `
                <div class="ah-content-body-sub">
                    ${a(item.sha.substring(0, 7), `${repoUrl}/commit/${item.sha}`, HoverCardType.COMMIT, `/${data.repo.name}/commit/${item.sha}/hovercard`)}
                    <span class="ah-content-body-commit-wiki" title="${item.message}">${item.message}</span>
                </div>
            `);
            return title(`Pushed ${commitsCount} to ${branchA} at ${repoA}`) + commits;
        case 'CreateEvent':
        case 'CreateBranchEvent':
        case 'CreateTagEvent':
            if (pl.refType === 'repository') {
                return title(`Created ${data.public ? '' : 'private'} repository ${repoA}`) + subContent(pl.description);
            }
            const refA = a(pl.ref, `${repoUrl}/tree/${pl.ref}`);
            if (pl.refType === 'branch') {
                data.type = 'CreateBranchEvent';
                return title(`Created branch ${refA} at ${repoA}`);
            } else if (pl.refType === 'tag') {
                data.type = 'CreateTagEvent';
                return title(`Created tag ${refA} at ${repoA}`);
            }
            return '';
        case 'WatchEvent':
            return title(`Starred repository ${repoA}`);
        case 'ForkEvent':
            return title(`Forked ${repoA} to ${a(pl.forkee.fullName, pl.forkee.htmlUrl, HoverCardType.REPO, `/${pl.forkee.fullName}/hovercard`)}`);
        case 'DeleteEvent':
            return title(`Deleted ${pl.refType} ${pl.ref} at ${repoA}`);
        case 'PublicEvent':
            return title(`Made repository ${repoA} ${data.public ? 'public' : 'private'}`);
        case 'IssuesEvent':
            return title(`${pl.action} issue ${a(`#${pl.issue.number}`, pl.issue.htmlUrl, HoverCardType.ISSUE, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.issue.title) + subContent(pl.issue.body);
        case 'IssueCommentEvent':
            return title(`${pl.action} ${a('comment', pl.comment.htmlUrl)} on issue ${a(`#${pl.issue.number}`, pl.issue.htmlUrl, HoverCardType.ISSUE, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.issue.title) + subContent(pl.comment.body);
        case 'PullRequestEvent':
            return title(`${pl.action} pull request ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.pullRequest.title) + subContent(pl.pullRequest.body);
        case 'PullRequestReviewEvent':
            return title(`${pl.action} a pull request review in pull request ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`);
        case 'PullRequestReviewCommentEvent':
            return title(`${pl.action} pull request review ${a('comment', pl.comment.htmlUrl)} in pull request ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.pullRequest.title) + subContent(pl.comment.body);
        case 'CommitCommentEvent':
            return title(`Created a ${a('comment', pl.comment.htmlUrl)} in commit ${a(`#${pl.comment.commitId.substring(0, 7)}`, `${repoUrl}/commit/${pl.comment.commitId}`, HoverCardType.COMMIT, `/${data.repo.name}/commit/${pl.comment.commitId}/hovercard`)} at ${repoA}`)
                + subContent(pl.comment.body);
        case 'MemberEvent':
            return title(`${pl.action} member ${a(pl.member.login, pl.member.htmlUrl, HoverCardType.USER, `/hovercards?user_id=${pl.member.id}`)} to ${repoA}`);
        case 'ReleaseEvent':
            return title(`${pl.action} release ${a(pl.release.tagName, pl.release.htmlUrl)} at ${repoA}`)
                + subtitle(pl.release.name) + subContent(pl.release.body);
        case 'GollumEvent':
            const pageCount = pl.pages.length > 1 ? `${pl.pages.length} wiki pages` : '1 wiki page';
            let pages = '';
            pl.pages.forEach(item => pages += `
                <div class="ah-content-body-sub">
                    ${item.action} ${a(item.sha.substring(0, 7), item.htmlUrl)}
                    <span class="ah-content-body-commit-wiki" title="${item.title}">${item.title}</span>
                </div>
            `);
            return title(`Update ${pageCount} at ${repoA}`) + pages;
        default:
            return title(`Unknown event: ${data.type}`);
    }
}

// ================
// helper functions
// ================

function hovercard(type: HoverCardType, url: string): string {
    return `data-hovercard-type="${type.toString()}" data-hovercard-url="${url}"`;
}

function title(content: string): string {
    return `<span class="ah-content-body-title">${content.capital()}</span>`;
}

function a(content: string, href: string, hover?: HoverCardType, hoverUrl?: string): string {
    return `<a href="${href}" target="_blank" ${(hover && hoverUrl) ? hovercard(hover, hoverUrl) : ''}>${content}</a>`;
}

function escape(str: string): string {
    return str ? str.replaceAll('<', '').replaceAll('>', '') : "";
}

function subtitle(content: string): string {
    content = escape(content);
    return `<div class="ah-content-body-sub ah-content-body-subtitle" title="${content}">${content}</div>`;
}

function subContent(content: string): string {
    content = escape(content);
    return `<div class="ah-content-body-sub ah-content-body-subcontent" title="${content}">${content}</div>`;
}

// ===========
// svg related
// ===========

/**
 * Get <svg> and <path> tag from event type.
 */
function getSvgTag(type: string): string {
    let svgClass: string = '',
        svgPath: string = '',
        svgHeight: number = 0,
        svgWidth: number = 0;
    switch (type) {
        case 'PushEvent':
            svgClass = 'octicon-repo-push';
            svgPath = 'M4 3H3V2h1v1zM3 5h1V4H3v1zm4 0L4 9h2v7h2V9h2L7 5zm4-5H1C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h4v-1H1v-2h4v-1H2V1h9.02L11 10H9v1h2v2H9v1h2c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'CreateEvent':
            svgClass = 'octicon-repo';
            svgPath = 'M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'CreateBranchEvent':
            svgClass = 'octicon-git-branch';
            svgPath = 'M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 10];
            break;
        case 'CreateTagEvent':
        case 'ReleaseEvent':
            svgClass = 'octicon-tag';
            svgPath = 'M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'WatchEvent':
            svgClass = 'octicon-star';
            svgPath = 'M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'MemberEvent':
            svgClass = 'octicon-organization';
            svgPath = 'M16 12.999c0 .439-.45 1-1 1H7.995c-.539 0-.994-.447-.995-.999H1c-.54 0-1-.561-1-1 0-2.634 3-4 3-4s.229-.409 0-1c-.841-.621-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.442.58 2.5 3c.058 2.41-.159 2.379-1 3-.229.59 0 1 0 1s1.549.711 2.42 2.088C9.196 9.369 10 8.999 10 8.999s.229-.409 0-1c-.841-.62-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.437.581 2.495 3c.059 2.41-.158 2.38-1 3-.229.59 0 1 0 1s3.005 1.366 3.005 4z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'IssuesEvent':
            svgClass = 'octicon-issue-opened';
            svgPath = 'M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'IssueCommentEvent':
        case 'CommitCommentEvent':
            svgClass = 'octicon-comment';
            svgPath = 'M14 1H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h2v3.5L7.5 11H14c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 9H7l-2 2v-2H2V2h12v8z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'ForkEvent':
            svgClass = 'octicon-repo-forked';
            svgPath = 'M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 10];
            break;
        case 'PullRequestEvent':
            svgClass = 'octicon-git-pull-request';
            svgPath = 'M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'PullRequestReviewEvent':
        case 'PullRequestReviewCommentEvent':
            svgClass = 'octicon-eye';
            svgPath = 'M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'DeleteEvent':
            svgClass = 'octicon-x';
            svgPath = 'M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'PublicEvent':
            svgClass = 'octicon-lock';
            svgPath = 'M4 13H3v-1h1v1zm8-6v7c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h1V4c0-2.2 1.8-4 4-4s4 1.8 4 4v2h1c.55 0 1 .45 1 1zM3.8 6h4.41V4c0-1.22-.98-2.2-2.2-2.2-1.22 0-2.2.98-2.2 2.2v2H3.8zM11 7H2v7h9V7zM4 8H3v1h1V8zm0 2H3v1h1v-1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'GollumEvent':
            svgClass = 'octicon-book';
            svgPath = 'M3 5h4v1H3V5zm0 3h4V7H3v1zm0 2h4V9H3v1zm11-5h-4v1h4V5zm0 2h-4v1h4V7zm0 2h-4v1h4V9zm2-6v9c0 .55-.45 1-1 1H9.5l-1 1-1-1H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h5.5l1 1 1-1H15c.55 0 1 .45 1 1zm-8 .5L7.5 3H2v9h6V3.5zm7-.5H9.5l-.5.5V12h6V3z';
            [svgHeight, svgWidth] = [16, 16];
            break;
    }
    if (!svgClass) {
        return '';
    }

    return `
        <svg class="octicon ${svgClass}" version="1.1" aria-hidden="true" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <path class="octicon-path" fill-rule="evenodd" d="${svgPath}"></path>
        </svg>
    `;
}

/**
 * Get <path> tag for given type.
 */
export function getPathTag(type: 'rocket' | 'checked' | 'database'): string {
    switch (type) {
        case 'rocket':
            return `
                <path fill-rule="evenodd"
                    d="M14.064 0a8.75 8.75 0 00-6.187 2.563l-.459.458c-.314.314-.616.641-.904.979H3.31a1.75 1.75 0 00-1.49.833L.11 7.607a.75.75 0 00.418 1.11l3.102.954c.037.051.079.1.124.145l2.429 2.428c.046.046.094.088.145.125l.954 3.102a.75.75 0 001.11.418l2.774-1.707a1.75 1.75 0 00.833-1.49V9.485c.338-.288.665-.59.979-.904l.458-.459A8.75 8.75 0 0016 1.936V1.75A1.75 1.75 0 0014.25 0h-.186zM10.5 10.625c-.088.06-.177.118-.266.175l-2.35 1.521.548 1.783 1.949-1.2a.25.25 0 00.119-.213v-2.066zM3.678 8.116L5.2 5.766c.058-.09.117-.178.176-.266H3.309a.25.25 0 00-.213.119l-1.2 1.95 1.782.547zm5.26-4.493A7.25 7.25 0 0114.063 1.5h.186a.25.25 0 01.25.25v.186a7.25 7.25 0 01-2.123 5.127l-.459.458a15.21 15.21 0 01-2.499 2.02l-2.317 1.5-2.143-2.143 1.5-2.317a15.25 15.25 0 012.02-2.5l.458-.458h.002zM12 5a1 1 0 11-2 0 1 1 0 012 0zm-8.44 9.56a1.5 1.5 0 10-2.12-2.12c-.734.73-1.047 2.332-1.15 3.003a.23.23 0 00.265.265c.671-.103 2.273-.416 3.005-1.148z">
                </path>
            `;
        case 'checked':
            return `
                <path
                    d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z">
                </path>
            `;
        case 'database':
            return `
                <path
                    d="M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z">
                </path>
            `;
    }
}
