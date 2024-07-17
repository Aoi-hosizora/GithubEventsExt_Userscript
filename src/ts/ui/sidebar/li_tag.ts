import moment from 'moment';
import { EventInfo, HoverCardType } from '@src/ts/data/model';
import { getSvgTag } from '@src/ts/ui/sidebar/svg_tag';
import { Global } from '@src/ts/data/global';

// ===================
// format info related
// ===================

/**
 * Format RepoInfo to <li> string.
 */
export function formatInfoToLiTag(item: EventInfo): string {
    const body = formatInfoToBody(item);
    if (!body) {
        return "";
    }
    const isBot = item.actor.login.endsWith('[bot]');
    const userUrl = !isBot ? `https://github.com/${item.actor.login}` : `https://github.com/apps/${item.actor.login.replaceAll('[bot]', '')}`;
    const userHovercard = !isBot ? hovercard(HoverCardType.USER, `/hovercards?user_id=${item.actor.id}`) : '';
    const createAt = moment(new Date(item.createdAt));
    const displayCreateAt = createAt.format('YY/MM/DD HH:mm:ss');
    const fullCreateAt = `${createAt.format('YYYY/MM/DD dddd, HH:mm:ss')} (${createAt.fromNow()})`;
    const itemTypeTitle = item.type == item.type2 || !Global.showFullEventTooltip ? item.type2 : `${item.type} (${item.type2})`;
    var html = `
        <li>
            <div class="ah-content-header">
                <!-- ////// Avatar | Username | Event icon ////// -->
                <div class="ah-content-header-user">
                    <div class="ah-content-header-left">
                        <a href="${userUrl}" target="_blank" style="text-decoration:none" ${userHovercard}>
                            <img class="ah-content-header-avatar ah-content-header-icon" src="${item.actor.avatarUrl}" alt="" />
                        </a>
                        <span class="ah-content-header-link">
                            <a href="${userUrl}" target="_blank" ${userHovercard}>${item.actor.login}</a>
                        </span>
                    </div>
                    <span
                        class="ah-content-header-event ah-content-header-icon ${Global.useOldIcon ? 'ah-content-header-old-icon' : ''}"
                        title="${itemTypeTitle}" style="${Global.useOldIcon ? '' : 'color: var(--fgColor-muted);'}">
                        ${getSvgTag(item.type2)}
                    </span>
                </div>
                <!-- ////// Date time | Private badge ////// -->
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
    return html.replaceAll(/<!--[\s\S]+?-->/, '');
}

/**
 * Format RepoInfo to tags that will be put inside body <div>.
 */
function formatInfoToBody(data: EventInfo): string {
    const pl = data.payload;
    const repoUrl = `http://github.com/${data.repo.name}`;
    const repoA = a(data.repo.name, repoUrl, HoverCardType.REPO, `/${data.repo.name}/hovercard`);
    data.type2 = data.type; // 以后使用该类型
    switch (data.type2) {
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
                data.type2 = 'CreateBranchEvent';
                return title(`Created branch ${refA} at ${repoA}`);
            } else if (pl.refType === 'tag') {
                data.type2 = 'CreateTagEvent';
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
            if (pl.action == 'closed') {
                if (pl.issue.stateReason == 'completed') {
                    data.type2 = 'CloseCompletedIssueEvent';
                } else if (pl.issue.stateReason == 'not_planned') {
                    data.type2 = 'CloseNotPlannedIssueEvent';
                }
            }
            return title(`${pl.action} issue ${a(`#${pl.issue.number}`, pl.issue.htmlUrl, HoverCardType.ISSUE, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.issue.title) + subContent(pl.issue.body);
        case 'IssueCommentEvent':
            return title(`${pl.action} ${a('comment', pl.comment.htmlUrl)} on issue ${a(`#${pl.issue.number}`, pl.issue.htmlUrl, HoverCardType.ISSUE, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.issue.title) + subContent(pl.comment.body);
        case 'PullRequestEvent':
            if (pl.action == 'closed') {
                if (pl.pullRequest.mergedAt !== null) {
                    data.type2 = 'MergePullRequestEvent';
                    pl.action = 'merged';
                } else {
                    data.type2 = 'ClosePullRequestEvent';
                }
            }
            return title(`${pl.action} pull request ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`)
                + subtitle(pl.pullRequest.title) + subContent(pl.pullRequest.body);
        case 'PullRequestReviewEvent':
            return title(`${pl.action} a pull request review in ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`);
        case 'PullRequestReviewCommentEvent':
            return title(`${pl.action} pull request review ${a('comment', pl.comment.htmlUrl)} in ${a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, HoverCardType.PULL, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)} at ${repoA}`)
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
