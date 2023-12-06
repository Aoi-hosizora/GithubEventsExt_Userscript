import $ from 'jquery';
import moment from "moment";
import { Global } from "@src/ts/data/storage";
import { RepoInfo, UserInfo, URLType } from "@src/ts/data/model";
import { getPathTag } from "@src/ts/ui/sidebar";
import {
    Completer, formatBytes, handleGithubTurboProgressBar, observeAttributes,
    requestRepoContents, requestRepoInfo, requestRepoTreeInfo, requestUserInfo, observeChildChanged, getDocumentScrollYOffset
} from "@src/ts/utils/utils";

// =================
// global ui related
// =================

/**
 * Adjust GitHub global UI without observer.
 */
export function adjustGlobalUIObservably() {
    // 1. (fixed)
    adjustHovercardZindex();

    // 2. (fixed)
    adjustGlobalModalDialogLayout();
    var menuLoaded = adjustUserModalDialogLayout();

    // 3. (configurable)
    menuLoaded.then((ok) => {
        if (ok && Global.showFollowMenuItem) {
            showFollowAvatarMenuItem();
        }
    });
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
 * Adjust modal dialog for layout.
 */
function adjustModalDialogLayout(
    headerClassName: string,
    ifAddedChecker: (element?: Element) => boolean,
    adjustOverlayLayout: (element: JQuery<HTMLElement>, opened: boolean) => void,
): Promise<boolean> {
    const completer = new Completer<boolean>();

    const headerDiv = $(`div.${headerClassName}`);
    const sidePanel = headerDiv.find('deferred-side-panel');
    if (!sidePanel.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }

    const modalDialogOverlay = headerDiv.find('div.Overlay-backdrop--side');
    const modalDialog = headerDiv.find('modal-dialog');
    if (!modalDialog.length || !modalDialogOverlay.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }

    if (headerDiv.find('include-fragment').length) {
        observeTempNode(); // observe temp node, and than observe new node
    } else {
        observeRealNode(); // observe new node directly
        completer.complete(true);
    }
    return completer.future();

    // >>> two helpers functions

    function observeTempNode() {
        // 1. observe the node which will be deleted
        adjustOverlayLayout(modalDialogOverlay, false); // adjust margin first
        var tempObserver = observeAttributes(modalDialog[0], (record, el) => {
            if (record.attributeName === 'open') {
                var opened = el.hasAttribute('open');
                adjustOverlayLayout(modalDialogOverlay, opened);
                if (!opened) {
                    // restore scroll offset, maybe a bug of GitHub
                    document.documentElement.scrollTo({ top: getDocumentScrollYOffset() });
                }
            }
        });

        // 2. observe the header div for node adding, and starting new observing
        var observer = observeChildChanged(sidePanel[0], (record) => {
            if (!record.addedNodes) {
                return;
            }

            var added = false;
            for (var node of record.addedNodes) {
                if (ifAddedChecker(node as Element) === true) {
                    added = true; // this node is added in interactive manner
                    tempObserver.disconnect();
                    observer.disconnect(); // after node is added, disconnect the observer
                    break;
                }
            }
            if (!added) {
                return;
            }

            observeRealNode();
            completer.complete(true);
        });
    }

    function observeRealNode() {
        // 3. observe the new node which is inserted when dialog loaded
        const modalDialogOverlay = headerDiv.find('div.Overlay-backdrop--side');
        const modalDialog = headerDiv.find('modal-dialog');
        if (!modalDialog.length || !modalDialogOverlay.length) {
            return;
        }

        adjustOverlayLayout(modalDialogOverlay, true); // adjust margin first
        observeAttributes(modalDialog[0], (record, el) => {
            if (record.attributeName === 'open') {
                var opened = el.hasAttribute('open');
                adjustOverlayLayout(modalDialogOverlay, opened);
                if (!opened) {
                    // restore scroll offset, maybe a bug of GitHub
                    document.documentElement.scrollTo({ top: getDocumentScrollYOffset() });
                }
            }
        });
    }
}

/**
 * Adjust global modal dialog for its layout.
 */
function adjustGlobalModalDialogLayout() {
    adjustModalDialogLayout(
        'AppHeader-globalBar-start',
        (element) => element?.tagName?.toLowerCase() === 'div' && element?.classList.contains('Overlay-backdrop--side') === true,
        (element, _) => {
            const showOctotree = $('html').hasClass('octotree-show');
            const octotree = $('nav.octotree-sidebar.octotree-github-sidebar');
            if (showOctotree && octotree.length) {
                element.css('margin-left', `${octotree.width()}px`);
            } else {
                element.css('margin-left', '0');
            }
            $('body').css('padding-right', '0');
            $('body').css('overflow', 'initial');
        },
    );
}

/**
 * Adjust user modal dialog for its layout.
 */
function adjustUserModalDialogLayout(): Promise<boolean> {
    return adjustModalDialogLayout(
        'AppHeader-user',
        (element) => element?.tagName?.toLowerCase() === 'user-drawer-side-panel',
        (element, _) => {
            if (Global.urlInfo.type !== URLType.OTHER && Global.pinned) {
                element.css('margin-right', `${Global.width}px`);
            } else {
                element.css('margin-right', '0');
            }
            $('body').css('padding-right', '0');
            $('body').css('overflow', 'initial');
        },
    );
}

/**
 * Add follow* menu items to avatar dropdown menu.
 */
function showFollowAvatarMenuItem() {
    var modalDialog = $('div.AppHeader-user modal-dialog');
    var avatarMenuUl = modalDialog.find('nav[aria-label="User navigation"] ul');
    if (!avatarMenuUl.length) {
        return;
    }

    function generateMenuItem(id: string, text: string, href: string, svgPath: string) {
        return `<li data-item-id="${id}" data-targets="nav-list.items" data-view-component="true" class="ActionListItem">
            <a data-analytics-event="" test-data="${text}" href="${href}" data-view-component="true" class="ActionListContent ActionListContent--visual16">
                <span class="ActionListItem-visual ActionListItem-visual--leading">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon">
                        ${svgPath}
                    </svg>
                </span>
                <span data-view-component="true" class="ActionListItem-label">
                    ${text}
                </span>
            </a>
        </li>`;
    }

    const username = modalDialog.find('div.Overlay-header span:first-child')[0].textContent?.trim() ?? '';
    const starsMenuItem = avatarMenuUl.find('li.ActionListItem a[data-analytics-event*="YOUR_STARS"]').parent();
    if (!$('li[data-item-id="ah-avatar-followers"]').length) {
        $(generateMenuItem('ah-avatar-followers', 'Your followers', `/${username}?tab=followers`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
    if (!$('li[data-item-id="ah-avatar-following"]').length) {
        $(generateMenuItem('ah-avatar-following', 'Your following', `/${username}?tab=following`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
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

    const repoCounterA = $('header.AppHeader nav a#repositories-tab');
    if (repoCounterA.length) {
        const title = `Public: ${info.publicRepos}, private: ${info.totalPrivateRepos}, total: ${info.publicRepos + info.totalPrivateRepos}`;
        repoCounterA[0].setAttribute('title', title);
        const repoCounterSpan = $('nav a#repositories-tab span:last-child');
        if (repoCounterSpan.length) {
            repoCounterSpan[0].textContent = `${info.publicRepos} / ${info.publicRepos + info.totalPrivateRepos}`;
            repoCounterSpan[0].setAttribute('title', title);
        }
    }

    const gistCounterA = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child');
    if (gistCounterA.length && gistCounterA[0].textContent?.includes('Gists') == true) {
        const title = `Public: ${info.publicGists}, private: ${info.privateGists}, total: ${info.publicGists + info.privateGists}`;
        gistCounterA[0].setAttribute('title', title);
        let gistCounterSpan = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child span:last-child');
        if (!gistCounterSpan.length) {
            gistCounterA.append('<span data-view-component="true" class="Counter" />');
            gistCounterSpan = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child span:last-child');
        }
        if (gistCounterSpan.length) {
            gistCounterSpan[0].textContent = `${info.publicGists} / ${info.publicGists + info.privateGists}`;
            gistCounterSpan[0].setAttribute('title', title);
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

    // *. render size string and grid title
    function renderSizeAndTitle(filename: string): string[] {
        let [sizeFormatted, gridTitle] = ['', ''];
        let fileSize = contentsSize.get([repoExtra.path, filename].filter(p => !!p).join('/'));
        if (Global.contentsSizeCache && !fileSize) {
            fileSize = 0;
        }
        if (fileSize !== undefined) {
            sizeFormatted = formatBytes(fileSize);
            gridTitle = `"${filename}" size: ${sizeFormatted} / ${fileSize} bytes`;
        }
        return [sizeFormatted, gridTitle];
    }

    // 3. show / update each content size grid
    for (const row of $('div.Box div[role="grid"] div[role="row"]')) {
        if (row.querySelector('div[role="rowheader"]>a[rel="nofollow"]')) {
            continue; // ".." line
        }
        let [sizeFormatted, gridTitle] = ['', ''];
        const filename = row.querySelector('div[role="rowheader"]')?.textContent?.trim() ?? '';
        if (filename) {
            [sizeFormatted, gridTitle] = renderSizeAndTitle(filename);
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

    // 4. wait for loading finishing (new style)
    await new Promise<void>((resolve, _) => {
        const unloadedRows = () => {
            var emptyRows = [];
            for (var td of $('table[aria-labelledby="folders-and-files"] tr.react-directory-row td:last-child')) {
                if ((td.textContent ?? '').trim().length === 0) {
                    emptyRows.push(td);
                }
            }
            return emptyRows;
        };
        if (unloadedRows().length) {
            resolve();
            return;
        }
        const interval = setInterval(() => {
            if (unloadedRows().length) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });

    // 5. show / update each content size grid (new style)
    await new Promise((resolve, _) => {
        setTimeout(() => resolve(null), 200);
    });
    if (!$('th#ah-file-size-header').length) {
        const headLastTh = $('table[aria-labelledby="folders-and-files"] thead tr th:last-child');
        $(`<th id="ah-file-size-header" style="width: 80px">
            <div title="Item size">
                Item size
            </div>
        </th>`).insertBefore(headLastTh);
    }
    var firstRow = $('table[aria-labelledby="folders-and-files"] tr#folder-row-0>td');
    if (firstRow.length) {
        firstRow[0].setAttribute('colspan', '4');
    }
    for (const row of $('table[aria-labelledby="folders-and-files"] tr.react-directory-row')) {
        let [sizeFormatted, gridTitle] = ['', ''];
        const filename = row.querySelector('div.react-directory-filename-column h3')?.textContent?.trim() ?? '';
        if (filename) {
            [sizeFormatted, gridTitle] = renderSizeAndTitle(filename);
        }
        const sizeTd = row.querySelector('td.ah-file-size');
        if (!sizeTd) {
            $('<td>', {
                class: 'ah-file-size color-fg-muted', style: 'width: 80px;',
                text: sizeFormatted, title: gridTitle,
            }).insertBefore(row.querySelector('td:last-child')!);
        } else {
            sizeTd.textContent = sizeFormatted;
            sizeTd.setAttribute('title', gridTitle);
        }
    }
}
