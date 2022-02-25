import GMApi from 'greasemonkey';
import $ from 'jquery';
import moment from 'moment';
import template from '@src/html/template.html';
import style from '@src/scss/core.scss';
import { Global } from '@src/ts/global';
import { URLType, UserInfo } from '@src/ts/model';
import { loadGitHubEvents, registerUIEvents } from '@src/ts/ui_events';
import { observeAttributes, requestUserInfo } from '@src/ts/utils';
import { getPathTag } from '@src/ts/sidebar_ui';

/**
 * Adjust GitHub UI !!!
 */
export function adjustGitHubUI() {
    // 1. global UI
    adjustGlobalUIDirectly();

    // 2. user UI
    if (Global.urlInfo.type == URLType.USER) {
        adjustUserUIObservably();
    }

    // 3. repo UI
    if (Global.urlInfo.type == URLType.REPO) {
        adjustRepoUIObservably();
    }
}

/**
 * Adjust GitHub global UI without observer.
 */
function adjustGlobalUIDirectly() {
    // 1. add menu items to avatar dropdown menu
    if (Global.showFollowMenu) {
        const avatarDetails = $('header div.Header-item:last-child details')[0];
        const observer = observeAttributes(avatarDetails, (record, el) => {
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
                const username = $('details-menu a[data-ga-click$="Signed in as"]')!!.text();
                if (username) { // wait until items appeared
                    const gistsMenuItem = $('details-menu a[data-ga-click$="gists"]')!!;
                    const upgradeMenuItem = $('details-menu a[data-ga-click$="upgrade"]')!!;
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
}

/**
 * Adjust GitHub user profile UI with observer.
 */
function adjustUserUIObservably() {
    async function handler() {
        // 0. get user information
        let info: UserInfo | undefined;
        if (Global.showJoinedTime || Global.showUserPrivateCounter) {
            try {
                info = await requestUserInfo(Global.urlInfo.author, Global.token);
            } catch (_) { }
        }

        // 1. center follow* text
        if (Global.centerFollowText) {
            $('div.js-profile-editable-area div.flex-md-order-none').css('text-align', 'center');
        }

        // 2. add joined time 
        if (Global.showJoinedTime && info && info.createdAt && !$('ul.vcard-details li[itemprop="join time"]').length) {
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

        // 3. add private counters
        if (Global.showUserPrivateCounter && info && Global.urlInfo.isMe && Global.token) {
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
        };
    }

    // ===> start here
    handler();
    observeAttributes($('span.progress-pjax-loader')[0], (record, el) => {
        if (record.attributeName === 'class' && !el.classList.contains("is-loading")) {
            handler();
        }
    });
}

/**
 * Adjust GitHub repo UI with observer.
 */
function adjustRepoUIObservably() {
    async function handler() {
        // 1. adjust stuck header z-index
        const stuckHeader = $("div#partial-discussion-header div.js-sticky.js-sticky-offset-scroll.gh-header-sticky");
        const headerShadow = $("div#partial-discussion-header div.gh-header-shadow");
        if (stuckHeader.length && headerShadow.length) {
            stuckHeader.css('z-index', '89');
            headerShadow.css('z-index', '88');
        }

        // 2. improve repo page margin when using octotree
        if ($('nav.octotree-sidebar').length) {
            $('main#js-repo-pjax-container>div.container-xl').attr('style', 'margin-left: auto !important; margin-right: auto !important;');
        }

        // 3. show counter and add link for page head buttons
        if (Global.showRepoActionCounter) {
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
            }
            const starCounterSpan = $('#repo-stars-counter-star');
            const unstarCounterSpan = $('#repo-stars-counter-unstar');
            starCounterSpan.attr('style', 'display: inline-block;');
            starCounterSpan.addClass('ah-hover-underline');
            unstarCounterSpan.attr('style', 'display: none;');
            if (!$('#repo-stars-counter-a').length) {
                // => <a #counter-a><span .btn><span #counter-star>...</span></span></a>
                starCounterSpan.wrap(`<a href="/${repoName}/stargazers" id="repo-stars-counter-a" class="BtnGroup-parent"></a>`);
                starCounterSpan.wrap(`<span class="btn-sm btn BtnGroup-item px-1" style="color: var(--color-accent-fg);"></span>`);
                $('#repo-stars-counter-a').insertAfter($('form.unstarred.js-social-form.BtnGroup-parent'));
                const starSummary = $('summary.BtnGroup-item[aria-label="Add this repository to a list"]');
                starSummary.removeClass('px-2');
                starSummary.addClass('px-1');
            };
        }
    }

    // ===> start here
    handler();
    observeAttributes($('span.progress-pjax-loader')[0], (record, el) => {
        if (record.attributeName === 'class' && !el.classList.contains("is-loading")) {
            handler();
        }
    });
}

/**
  * Add sidebar to GitHub !!!
 */
export function injectSidebar() {
    const info = Global.urlInfo;
    if (info.type === URLType.OTHER) {
        // only show sidebar on user, org, repo page
        return;
    }

    // 1. inject html into GitHub page
    $('body').append(getSidebarHtml());
    GMApi.GM_addStyle(style);

    // 2. register sidebar's UI events
    registerUIEvents();

    // 3. start loading GitHub events
    loadGitHubEvents();
}

/**
 * Get and format sidebar html from template.
 */
function getSidebarHtml(): string {
    const info = Global.urlInfo;
    let renderedTemplate = template
        .replaceAll(/<!--[\s\S]+?-->/, '')
        .replaceAll('${urlType}', info.type.toString())
        .replaceAll('${apiUrl}', info.eventAPI)
        .replaceAll('${checkedPath}', getPathTag('checked'))
        .replaceAll('${feedbackUrl}', Global.FEEDBACK_URL);

    const reAuthor = /\$\{if isAuthor\}([\s\S]+?)\$\{endif\}/m;
    const reRepo = /\$\{if isRepo\}([\s\S]+?)\$\{endif\}/m;
    if (info.type === URLType.REPO) {
        renderedTemplate = renderedTemplate
            .replaceAll(reAuthor, '')
            .replaceAll(reRepo, reRepo.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author)
            .replaceAll('${info.repoUrl}', info.repoURL)
            .replaceAll('${info.repo}', info.repo);
    } else {
        renderedTemplate = renderedTemplate
            .replaceAll(reRepo, '')
            .replaceAll(reAuthor, reAuthor.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author);
    }

    return renderedTemplate;
}
