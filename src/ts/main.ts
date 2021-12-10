import { GMApi } from 'greasemonkey';
import $ from 'jquery';
import moment from 'moment';
import template from '../html/template.html';
import style from '../scss/core.scss';
import { Global } from './global';
import { URLType } from './model';
import { loadGithubEvents, registerUIEvents } from './ui_events';
import { requestUserInfo } from './util';

/**
 * Adjust github UI.
 */
export function adjustGithubUI() {
    // 1. modify github shadow header z-index
    const stuckHeader = $("div#partial-discussion-header div.js-sticky.js-sticky-offset-scroll.gh-header-sticky");
    const headerShadow = $("div#partial-discussion-header div.gh-header-shadow");
    if (stuckHeader.length && headerShadow.length) {
        stuckHeader.css('z-index', '89');
        headerShadow.css('z-index', '88');
    }

    // 2. insert items to profile menu
    const avatarMenuSummary = $('summary.Header-link[aria-label="View profile and more"]');
    const menuHoverHdl = () => {
        avatarMenuSummary.off('mouseenter', menuHoverHdl);
        const intervalHdl = setInterval(() => {
            if ($('details-menu a[data-ga-click$="your followers"]').length) {
                clearInterval(intervalHdl);
                return;
            }
            const username = $('details-menu a[data-ga-click$="Signed in as"] strong')!!.text();
            if (!username) {
                return;
            }

            const yourGistsMenuItem = $('details-menu a[data-ga-click$="your gists"]');
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: `/${username}?tab=followers`,
                text: 'Your followers',
                'data-ga-click': 'Header, go to followers, text:your followers'
            }).insertBefore(yourGistsMenuItem);
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: `/${username}?tab=following`,
                text: 'Your following',
                'data-ga-click': 'Header, go to followings, text:your following'
            }).insertBefore(yourGistsMenuItem);
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: '/',
                text: 'GitHub Homepage',
                'data-ga-click': 'Header, go to homepage, text:homepage'
            }).insertAfter(yourGistsMenuItem);
        }, 1000);
    };
    avatarMenuSummary.on('mouseenter', menuHoverHdl);

    // 3. improve repo page margin under octotree
    if (Global.urlInfo.type === URLType.REPO) {
        $('main#js-repo-pjax-container>div.container-xl').attr('style', 'margin-left: auto !important; margin-right: auto !important;');
    }

    // 4. update user profile page
    if (Global.urlInfo.type == URLType.USER) {
        adjustUserProfileUI();
    }
}

/**
 * Adjust github user profile UI.
 */
async function adjustUserProfileUI(observe: boolean = true) {
    // 1. add join time and private counters
    const isMe = $('div.js-profile-editable-area button').length;
    try {
        const info = await requestUserInfo(Global.urlInfo.author, Global.token);
        if (info.createdAt) {
            const joinTimeString = moment(new Date(info.createdAt)).format('YYYY/MM/DD HH:mm');
            const joinTimeLi = $('ul.vcard-details li[itemprop="join time"]');
            if (!joinTimeLi.length) {
                $('ul.vcard-details').append(
                    `<li class="vcard-detail pt-1" itemprop="join time">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-rocket">
                            <path fill-rule="evenodd" d="M14.064 0a8.75 8.75 0 00-6.187 2.563l-.459.458c-.314.314-.616.641-.904.979H3.31a1.75 1.75 0 00-1.49.833L.11 7.607a.75.75 0 00.418 1.11l3.102.954c.037.051.079.1.124.145l2.429 2.428c.046.046.094.088.145.125l.954 3.102a.75.75 0 001.11.418l2.774-1.707a1.75 1.75 0 00.833-1.49V9.485c.338-.288.665-.59.979-.904l.458-.459A8.75 8.75 0 0016 1.936V1.75A1.75 1.75 0 0014.25 0h-.186zM10.5 10.625c-.088.06-.177.118-.266.175l-2.35 1.521.548 1.783 1.949-1.2a.25.25 0 00.119-.213v-2.066zM3.678 8.116L5.2 5.766c.058-.09.117-.178.176-.266H3.309a.25.25 0 00-.213.119l-1.2 1.95 1.782.547zm5.26-4.493A7.25 7.25 0 0114.063 1.5h.186a.25.25 0 01.25.25v.186a7.25 7.25 0 01-2.123 5.127l-.459.458a15.21 15.21 0 01-2.499 2.02l-2.317 1.5-2.143-2.143 1.5-2.317a15.25 15.25 0 012.02-2.5l.458-.458h.002zM12 5a1 1 0 11-2 0 1 1 0 012 0zm-8.44 9.56a1.5 1.5 0 10-2.12-2.12c-.734.73-1.047 2.332-1.15 3.003a.23.23 0 00.265.265c.671-.103 2.273-.416 3.005-1.148z"></path>
                        </svg>
                        <span>Joined at ${joinTimeString}</span>
                    </li>`
                );
            }
        }
        if (isMe && Global.token) {
            for (const navItem of $('nav a.UnderlineNav-item')) {
                const counterSpan = navItem.getElementsByTagName('span');
                if (!counterSpan.length) {
                    continue;
                }
                if (navItem.innerText.includes('Repositories') && info.totalPrivateRepos) {
                    counterSpan[0].setAttribute('title', `Public: ${info.publicRepos}, private: ${info.totalPrivateRepos}, total: ${info.publicRepos + info.totalPrivateRepos}`);
                    counterSpan[0].textContent = `${info.publicRepos} / ${info.publicRepos + info.totalPrivateRepos}`;
                } else if (navItem.innerText.includes('Gists') && info.privateGists) {
                    counterSpan[0].setAttribute('title', `Public: ${info.publicGists}, private: ${info.privateGists}, total: ${info.publicGists + info.privateGists}`);
                    counterSpan[0].textContent = `${info.publicGists} / ${info.publicGists + info.privateGists}`;
                }
            }
        }
    } catch (_) { }

    // 2. center align follow* text
    $('div.js-profile-editable-area div.flex-md-order-none').css('text-align', 'center')

    // 3. observe route change
    if (observe) {
        const progressSpan = $("span.progress-pjax-loader")[0];
        const observer = new MutationObserver(mutationList => mutationList.forEach(mut => {
            if (mut.type === 'attributes' && mut.attributeName == 'class' && mut.target.nodeType == mut.target.ELEMENT_NODE) {
                const el = mut.target as Element;
                if (!el.classList.contains("is-loading")) {
                    adjustUserProfileUI(false);
                }
            }
        }));
        observer.observe(progressSpan, { attributes: true });
    }
}

/**
  * Add sidebar to github !!!
 */
export function injectSidebar() {
    const info = Global.urlInfo;
    if (info.type === URLType.OTHER) {
        return;
    }

    // 1. inject template into github page
    let renderedTemplate = template
        .replaceAll(/<!--[\s\S]+?-->/, '')
        .replaceAll('${urlType}', info.type.toString())
        .replaceAll('${apiUrl}', info.eventAPI);

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
    $('body').append(renderedTemplate);
    GMApi.GM_addStyle(style);

    // 2. register sidebar's UI events
    registerUIEvents();

    // 3. start loading github events
    loadGithubEvents();
}

