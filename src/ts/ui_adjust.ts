import $ from 'jquery';
import moment from "moment";
import { Global } from "@src/ts/global";
import { RepoInfo, UserInfo } from "@src/ts/model";
import { getPathTag } from "@src/ts/sidebar_ui";
import { formatBytes, handleGithubTurboProgressBar, observeAttributes, requestRepoContents, requestRepoInfo, requestRepoTreeInfo, requestUserInfo } from "@src/ts/utils";

// =================
// global ui related
// =================

/**
 * Adjust GitHub global UI without observer.
 */
export function adjustGlobalUI() {
    // 1. (fixed)
    adjustHovercardZindex();

    // 2. (configurable)
    if (Global.showFollowMenuItem) {
        showFollowAvatarMenuItem()
    }
}

/**
 * Adjust hovercard element for z-index.
 */
function adjustHovercardZindex() {
    const hovercard = $('div.Popover.js-hovercard-content');
    const mainDiv = $('div[data-turbo-body]');
    mainDiv.after(hovercard);
}

/**
 * Add follow* menu items to avatar dropdown menu.
 */
function showFollowAvatarMenuItem() {
    const avatarDetails = $('header div.Header-item:last-child details');
    if (!avatarDetails.length) {
        return;
    }
    const observer = observeAttributes(avatarDetails[0], (record, el) => {
        if (record.attributeName !== 'open' && !el.hasAttribute('open')) {
            return;
        }
        observer.disconnect(); // menu has been opened once, just disconnect the observer
        // use setInterval to wait for the menu updated
        const handler = setInterval(() => {
            if ($('details-menu a[data-ga-click$="your followers"]').length) {
                clearInterval(handler); // done
                return;
            }
            const username = $('details-menu a[data-ga-click$="Signed in as"]').text();
            if (username) { // wait until items appeared
                const gistsMenuItem = $('details-menu a[data-ga-click$="gists"]');
                const upgradeMenuItem = $('details-menu a[data-ga-click$="upgrade"]');
                $('<a>', {
                    role: 'menuitem', class: 'dropdown-item', href: `/${username}?tab=followers`,
                    text: 'Your followers', 'data-ga-click': 'Header, go to followers, text:your followers'
                }).insertBefore(gistsMenuItem);
                $('<a>', {
                    role: 'menuitem', class: 'dropdown-item', href: `/${username}?tab=following`,
                    text: 'Your following', 'data-ga-click': 'Header, go to followings, text:your following'
                }).insertBefore(gistsMenuItem);
                $('<a>', {
                    role: 'menuitem', class: 'dropdown-item', href: '/',
                    text: 'GitHub Homepage', 'data-ga-click': 'Header, go to homepage, text:homepage'
                }).insertBefore(upgradeMenuItem);
            }
        }, 250);
    });
}

// ===============
// user ui related
// ===============

/**
 * Adjust GitHub user profile UI with observer.
 */
export async function adjustUserUIObservably() {
    // 1. (configurable)
    if (Global.centerFollowText) {
        centerUserFollowText();
    }

    // 2/3. request user info first
    let info: UserInfo | undefined;
    if (Global.showJoinedTime || Global.showUserPrivateCounter) {
        try {
            info = await requestUserInfo(Global.urlInfo.author, Global.token);
        } catch (_) { }
    }

    // 2. (configurable)
    if (Global.showJoinedTime && info) {
        showUserJoinedTime(info);
    }

    // 3. (configurable)
    if (Global.showUserPrivateCounter && info) {
        addUserPrivateCounters(info);
    };
}

/**
 * Center user follow* text in user page.
 */
function centerUserFollowText() {
    $('div.js-profile-editable-area div.flex-md-order-none').css('text-align', 'center');
}

/**
 * Add user joined time in user page.
 */
function showUserJoinedTime(info: UserInfo) {
    if (!info.createdAt || $('ul.vcard-details li[itemprop="join time"]').length) {
        return;
    }
    const time = moment(new Date(info.createdAt)).format('YYYY/MM/DD HH:mm');
    $('ul.vcard-details').append(
        `<li class="vcard-detail pt-1" itemprop="join time">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-rocket">
                ${getPathTag('rocket')}
            </svg>
            <span>Joined at ${time}</span>
        </li>`
    );
}

/**
 * Add user private counters in user page.
 */
function addUserPrivateCounters(info: UserInfo) {
    if (!Global.token || !Global.urlInfo.extra.user!.isMe) {
        return;
    }
    for (const navItem of $('nav a.UnderlineNav-item')) {
        const counterSpan = navItem.getElementsByTagName('span');
        if (!counterSpan.length) {
            continue;
        }
        const text = navItem.innerText, span = counterSpan[0];
        if (text.includes('Repositories') && info.totalPrivateRepos) {
            span.setAttribute('title', `Public: ${info.publicRepos}, private: ${info.totalPrivateRepos}, total: ${info.publicRepos + info.totalPrivateRepos}`);
            span.textContent = `${info.publicRepos} / ${info.publicRepos + info.totalPrivateRepos}`;
        } else if (text.includes('Gists') && info.privateGists) {
            span.setAttribute('title', `Public: ${info.publicGists}, private: ${info.privateGists}, total: ${info.publicGists + info.privateGists}`);
            span.textContent = `${info.publicGists} / ${info.publicGists + info.privateGists}`;
        }
    }
}

// ===============
// repo ui related
// ===============

/**
 * Adjust GitHub repo UI with observer.
 */
export async function adjustRepoUIObservably() {
    // 1. (fixed)
    adjustRepoStuckHeader();
    fixOctotreePageMargin();

    // 2. (configurable)
    if (Global.showRepoActionCounter) {
        showRepoActionCounters();
    }

    // 3. (configurable)
    if (Global.showRepoAndContentsSize) {
        try {
            const repo = await requestRepoInfo(Global.urlInfo.author, Global.urlInfo.repo, Global.token);
            showRepoContentsSize(repo);
        } catch (_) { }
    }
}

/**
 * Adjust stuck header z-index in repo issue page.
 */
function adjustRepoStuckHeader() {
    const stuckHeader = $("div#partial-discussion-header div.js-sticky.js-sticky-offset-scroll.gh-header-sticky");
    const headerShadow = $("div#partial-discussion-header div.gh-header-shadow");
    if (stuckHeader.length && headerShadow.length) {
        stuckHeader.css('z-index', '89');
        headerShadow.css('z-index', '88');
    }
}

/**
 * Improve page margin when using octotree in repo page.
 */
function fixOctotreePageMargin() {
    if ($('nav.octotree-sidebar').length) {
        $('div#repo-content-pjax-container>div.clearfix.container-xl').attr('style', 'margin-left: auto !important; margin-right: auto !important;');
    }
}

/**
 * Show repo counter and add link for buttons in repo page head.
 */
function showRepoActionCounters() {
    const repoName = `${Global.urlInfo.author}/${Global.urlInfo.repo}`
    const watchCounterSpan = $('#repo-notifications-counter');
    watchCounterSpan.attr('style', 'display: inline-block;');
    watchCounterSpan.addClass('ah-hover-underline');
    if (!$('#repo-notifications-counter-a').length) {
        watchCounterSpan.wrap(`<a href="/${repoName}/watchers" id="repo-notifications-counter-a"></a>`);
    }

    const forkCounterSpan = $('#repo-network-counter');
    forkCounterSpan.attr('style', 'display: inline-block;')
    forkCounterSpan.addClass('ah-hover-underline');
    if (!$('#repo-network-counter-a').length) {
        forkCounterSpan.wrap(`<a href="/${repoName}/network/members" id="repo-network-counter-a"></a>`);
        const forkSummary = $('summary.BtnGroup-item[aria-label="See your forks of this repository"]');
        forkSummary.removeClass('px-2');
        forkSummary.addClass('px-1');
    }

    const starCounterSpan = $('#repo-stars-counter-star');
    starCounterSpan.attr('style', 'display: inline-block;');
    starCounterSpan.addClass('ah-hover-underline');
    const unstarCounterSpan = $('#repo-stars-counter-unstar');
    unstarCounterSpan.addClass('ah-hover-underline');
    unstarCounterSpan.attr('style', 'display: inline-block;');
    if (!$('#repo-stars-counter-a').length) {
        // => <div .unstarred><form /><a /><details /></div>
        // <a /> => <a #counter-a><span .btn><span #counter-star>...</span></span></a>
        const aTag = `
            <a href="/${repoName}/stargazers" id="repo-stars-counter-a" class="BtnGroup-parent">
                <span class="btn-sm btn BtnGroup-item px-1" style="color: var(--color-accent-fg);">
                </span>
            </a>
        `;
        starCounterSpan.wrap(aTag);
        unstarCounterSpan.wrap(aTag);
        $('#repo-stars-counter-a').insertAfter($('div.unstarred.BtnGroup.flex-1>form'));
        $('#repo-stars-counter-a').insertAfter($('div.starred.BtnGroup.flex-1>form'));

        const starSummary = $('summary.BtnGroup-item[aria-label="Add this repository to a list"]');
        starSummary.removeClass('px-2');
        starSummary.addClass('px-1');
    };
}

/**
 * Add repo and its contents (including files and directories) size in repo page.
 */
async function showRepoContentsSize(repoInfo: RepoInfo) {
    // 1. get repo size, show / update this tab
    const repoExtra = Global.urlInfo.extra.repo!;
    const sizeFormatted = formatBytes(repoInfo.size);
    let tabTitle = `repository size: ${sizeFormatted} / ${repoInfo.size} bytes`;
    if (!Global.contentsSizeCache) { // has not been loaded yet
        tabTitle += ' (click here to load directories size)';
    } else if (Global.contentsSizeTruncated) {
        tabTitle += ' (directories size have been loaded, but data truncated, size information may be incompleted)';
    } else {
        tabTitle += ' (directories size have been loaded successfully)';
    }
    const sizeTab = $('#ahid-contents-size');
    if (sizeTab.length) {
        sizeTab.attr('title', tabTitle);
    } else {
        $(`<li id="ahid-contents-size" title="${tabTitle}" style="cursor: pointer;" data-view-component="true" class="d-inline-flex">
            <a class="UnderlineNav-item hx_underlinenav-item no-wrap js-responsive-underlinenav-item js-selected-navigation-item">
                <svg width="12" height="16" viewBox="0 0 12 16" version="1.1" class="octicon octicon-data UnderlineNav-octicon d-none d-sm-inline">
                    ${getPathTag('database')}
                </svg>
                ${sizeFormatted}
            </a>
        </li>`).insertAfter($('nav.js-repo-nav ul li:last-child'));
        $('#ahid-contents-size').on('click', async () => {
            const progressBar = handleGithubTurboProgressBar();
            progressBar.startLoading();
            await updateSizeCache();
            progressBar.finishLoading();
        });
    }

    // *. generate contents size cache using repo tree info
    async function updateSizeCache() {
        try {
            const treeInfo = await requestRepoTreeInfo(Global.urlInfo.author, Global.urlInfo.repo, repoExtra.ref, Global.token);
            const cache = new Map<string, number>();
            const [files, dirs] = [treeInfo.tree.filter(i => i.type === 'blob'), treeInfo.tree.filter(i => i.type === 'tree')];
            files.forEach(f => cache.set(f.path, f.size));
            dirs.forEach(d => cache.set(d.path, files.filter(f => f.path.startsWith(d.path)).reduce((accumulate, f) => accumulate + f.size, 0)));
            Global.contentsSizeCache = cache; // only set once if ref unchanged
            Global.contentsSizeCachedRef = repoExtra.ref;
            Global.contentsSizeTruncated = treeInfo.truncated;
        } catch (_) { }
    }
    if (Global.contentsSizeCache && Global.contentsSizeCachedRef !== repoExtra.ref) {
        // ref has been changed, need to update size cache
        await updateSizeCache();
    }

    // 2. get contents size and wait for loading finishing
    let contentsSize = new Map<string /* fullName */, number>();
    if (Global.contentsSizeCache) {
        contentsSize = Global.contentsSizeCache; // file + dir
    } else {
        try {
            const contents = await requestRepoContents(Global.urlInfo.author, Global.urlInfo.repo, repoExtra.ref, repoExtra.path, Global.token);
            contents.filter(c => c.type === 'file').forEach(c => contentsSize.set(c.path, c.size)); // file only
        } catch (_) { }
    }
    await new Promise<void>((resolve, _) => {
        const skeleton = () => $('div.Box div[role="grid"] div[role="row"] div[role="gridcell"] div.Skeleton');
        if (!skeleton().length) {
            resolve();
            return;
        }
        const interval = setInterval(() => {
            if (!skeleton().length) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });

    // 3. show / update each content size grid
    for (const row of $('div.Box div[role="grid"] div[role="row"]')) {
        if (row.querySelector('div[role="rowheader"]>a[rel="nofollow"]')) {
            continue; // ".." line
        }
        let [sizeFormatted, gridTitle] = ['', ''];
        const filename = row.querySelector('div[role="rowheader"]')?.textContent?.trim() ?? '';
        if (filename) {
            let fileSize = contentsSize.get([repoExtra.path, filename].filter(p => !!p).join('/'));
            if (Global.contentsSizeCache && !fileSize) {
                fileSize = 0;
            }
            if (fileSize !== undefined) {
                sizeFormatted = formatBytes(fileSize);
                gridTitle = `"${filename}" size: ${sizeFormatted} / ${fileSize} bytes`;
            }
        }
        const sizeDiv = row.querySelector('div.ah-file-size');
        if (!sizeDiv) {
            $('<div>', {
                role: 'gridcell', class: 'mr-3 text-right color-fg-muted ah-file-size', style: 'width: 80px;',
                text: sizeFormatted, title: gridTitle,
            }).insertBefore(row.querySelector('div[role="gridcell"]:last-child')!);
        } else {
            sizeDiv.textContent = sizeFormatted;
            sizeDiv.setAttribute('title', gridTitle);
        }
    }
}
