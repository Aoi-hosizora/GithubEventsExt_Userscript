import { AxiosResponse } from 'axios';
import $ from 'jquery';
import moment from 'moment';
import { Global } from './global';
import { GithubInfo, Hovercard, UrlInfo } from './model';
import { getSvgTag, showMessage } from './ui_event';
import { fetchGithubEvents } from './util';

/**
 * !!! github events handler
 */
export function handleGithubEvent(info: UrlInfo, page: number = 1) {
    showMessage(false, 'Loading...');
    fetchGithubEvents(info, page).subscribe({
        next(resp: AxiosResponse<GithubInfo[]>) {
            showMessage(false, '');
            // console.log(resp);
            const ul = $('#ahid-ul');
            resp.data.forEach(item => {
                const li = wrapGithubLi(item);
                if (!li) {
                    return;
                }
                if (ul.text().trim() !== '') {
                    ul.append('<hr class="ah-hr" />');
                }
                const content = catAppend(item)
                    .replaceAll('\n', '')
                    .replaceAll('  ', ' ')
                    .replaceAll(' </a>', '</a>') // <a "xxx"> xxx </a>
                    .replaceAll('"> ', '">');
                ul.append(content);
            });
        },
        error(e: any) {
            if (page === 1) {
                showMessage(true, e);
            }
        }
    });
}

export function nextGithubEvent(info: UrlInfo) {
    handleGithubEvent(info, ++Global.page);
}

/**
 * Generate html li string from GithubInfo.
 */
function catAppend(item: GithubInfo): string {
    function userHovercard(id: number): string {
        return `
            data-hovercard-type="user"
            data-hovercard-url="/hovercards?user_id=${id}"
        `;
    }

    const createAtStr = moment(new Date(item.createdAt)).format('YYYY/MM/DD HH:mm:ss');
    return `
        <li>
            <div class="ah-content-header">
                <div class="ah-content-header-user">
                    <a href="https://github.com/${item.actor.login}" target="_blank" style="text-decoration:none" ${userHovercard(item.actor.id)}>
                        <img class="ah-content-header-icon ah-content-header-avatar" src="${item.actor.avatarUrl}" alt="" />
                    </a>
                    <span class="ah-content-header-link">
                        <a href="https://github.com/${item.actor.login}" target="_blank" ${userHovercard(item.actor.id)}>${item.actor.login}</a>
                    </span>
                    <span class="ah-content-header-icon ah-content-header-event" title="${item.type}">${getSvgTag(item.type)}</span>
                </div>
                <div class="ah-content-header-info">
                    <span class="ah-content-header-time">${createAtStr}</span>
                    ${item.public ? '' : '<span class="ah-content-header-private" title="This is a private event">Private</span>'}
                </div>
            </div>
    
            <div class="ah-content-body">
                ${wrapGithubLi(item)}
            </div>
        </li>
    `;
}

function wrapGithubLi(data: GithubInfo): string {
    const pl = data.payload;
    const repoUrl = `http://github.com/${data.repo.name}`;
    const repoA = a(data.repo.name, repoUrl, Hovercard.Repo, `/${data.repo.name}/hovercard`);

    switch (data.type) {
        case 'PushEvent':
            const commitCnt = pl.size > 1 ? `${pl.size} commits` : '1 commit';
            let commits = '';
            pl.commits.forEach(item => {
                commits += `
                    <div class="ah-content-body-sub">
                        ${a(item.sha.substring(0, 7), `${repoUrl}/commit/${item.sha}`, Hovercard.Commit, `/${data.repo.name}/commit/${item.sha}/hovercard`)}
                        <span class="ah-content-body-commit-wiki" title="${item.message}">${item.message}</span>
                    </div>
                `;
            });
            return title(`Pushed ${commitCnt} to ${pl.ref.split('/')[2]} at ${repoA}`)
                + commits;
        case 'WatchEvent':
            return title(`Starred repository ${repoA}`);
        case 'CreateBranchEvent':
        case 'CreateTagEvent':
        case 'CreateEvent':
            if (pl.refType === 'branch') {
                data.type = 'CreateBranchEvent';
                return title(`Created branch ${a(pl.ref, `${repoUrl}/tree/${pl.ref}`)} at ${repoA}`);
            } else if (pl.refType === 'tag') {
                data.type = 'CreateTagEvent';
                return title(`Created tag ${a(pl.ref, `${repoUrl}/tree/${pl.ref}`)} at ${repoA}`);
            } else if (pl.refType === 'repository') {
                return title(`Created ${data.public ? '' : 'private'} repository ${repoA}`)
                    + subContent(pl.description);
            } else {
                return '';
            }
        case 'ForkEvent':
            return title(`Forked ${repoA} to ${a(pl.forkee.fullName, pl.forkee.htmlUrl, Hovercard.Repo, `/${pl.forkee.fullName}/hovercard`)}`);
        case 'DeleteEvent':
            return title(`Deleted ${pl.refType} ${pl.ref} at ${repoA}`);
        case 'PublicEvent':
            return title(`Made repository ${repoA} ${data.public ? 'public' : 'private'}`);
        case 'IssuesEvent':
            return title(`${pl.action} issue ${
                a(`#${pl.issue.number}`, pl.issue.htmlUrl, Hovercard.Issue, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)
                } at ${repoA}`)
                + subTitle(pl.issue.title)
                + subContent(pl.issue.body);
        case 'IssueCommentEvent':
            return title(`${pl.action} ${a('comment', pl.comment.htmlUrl)} on issue ${
                a(`#${pl.issue.number}`, pl.issue.htmlUrl, Hovercard.Issue, `/${data.repo.name}/issues/${pl.issue.number}/hovercard`)
                } at ${repoA}`)
                + subTitle(pl.issue.title)
                + subContent(pl.comment.body);
        case 'PullRequestEvent':
            return title(`${pl.action} pull request ${
                a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, Hovercard.Pull, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)
                } at ${repoA}`)
                + subTitle(pl.pullRequest.title)
                + subContent(pl.pullRequest.body);
        case 'PullRequestReviewEvent':
            return title(`${pl.action} a pull request review in pull request ${
                a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, Hovercard.Pull, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)
                } at ${repoA}`);
        case 'PullRequestReviewCommentEvent':
            return title(`${pl.action} pull request review ${a('comment', pl.comment.htmlUrl)} in pull request ${
                a(`#${pl.pullRequest.number}`, pl.pullRequest.htmlUrl, Hovercard.Pull, `/${data.repo.name}/pull/${pl.pullRequest.number}/hovercard`)
                } at ${repoA}`)
                + subTitle(pl.pullRequest.title)
                + subContent(pl.comment.body);
        case 'CommitCommentEvent':
            return title(`Created a ${a('comment', pl.comment.htmlUrl)} in commit ${
                a(`#${pl.comment.commitId.substring(0, 7)}`, `${repoUrl}/commit/${pl.comment.commitId}`, Hovercard.Commit, `/${data.repo.name}/commit/${pl.comment.commitId}/hovercard`)
                } at ${repoA}`)
                + subContent(pl.comment.body);
        case 'MemberEvent':
            return title(`${pl.action} member ${a(pl.member.login, pl.member.htmlUrl, Hovercard.User, `/hovercards?user_id=${pl.member.id}`)} to ${repoA}`);
        case 'ReleaseEvent':
            return title(`${pl.action} release ${a(pl.release.tagName, pl.release.htmlUrl)} at ${repoA}`)
                + subTitle(pl.release.name)
                + subContent(pl.release.body);
        case 'GollumEvent':
            const pageCnt = pl.pages.length > 1 ? `${pl.pages.length} wiki pages` : '1 wiki page';
            let pages = '';
            pl.pages.forEach(item => {
                pages += `
                    <div class="ah-content-body-sub">
                        ${item.action} ${a(item.sha.substring(0, 7), item.htmlUrl)}
                        <span class="ah-content-body-commit-wiki" title="${item.title}">${item.title}</span>
                    </div>
                `;
            });
            return title(`Update ${pageCnt} at ${repoA}`)
                + pages;
        default:
            return title(`Unknwon event: ${data.type}`);
    }
}

// Helper

function title(content: string): string {
    return `<span class="ah-content-body-title">${content.capital()}</span>`;
}

function a(content: string, href: string, hover?: Hovercard, hoverUrl?: string): string {
    if (!hover || !hoverUrl) {
        return `<a href="${href}" target="_blank">${content}</a>`;
    } else {
        return `
            <a href="${href}" target="_blank" data-hovercard-type="${hover.toString()}" data-hovercard-url="${hoverUrl}">
                ${content}
            </a>
        `;
    }
}

function escape(str: string): string {
    return str.replaceAll('<', '').replaceAll('>', '');
}

function subTitle(content: string) {
    content = escape(content);
    return `<div class="ah-content-body-sub ah-content-body-subtitle" title="${content}">${content}</div>`;
}

function subContent(content: string) {
    content = escape(content);
    return `<div class="ah-content-body-sub ah-content-body-subcontent" title="${content}">${content}</div>`;
}
