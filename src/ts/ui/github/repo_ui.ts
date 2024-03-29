import $ from 'jquery';
import { Global } from "@src/ts/data/storage";
import { RepoInfo } from "@src/ts/data/model";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { formatBytes, handleGithubTurboProgressBar, requestRepoContents, requestRepoInfo, requestRepoTreeInfo } from "@src/ts/utils/utils";

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

    // 3. wait for loading finishing
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

    // 4. show / update each content size grid
    await new Promise((resolve, _) => {
        setTimeout(() => resolve(null), 200);
    });
    const firstLineTd = $('table[aria-labelledby="folders-and-files"] tr:nth-of-type(1) td');
    firstLineTd[0].setAttribute('colspan', '4');
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
