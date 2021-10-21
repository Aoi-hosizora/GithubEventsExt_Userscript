import { GMApi } from 'greasemonkey';
import $ from 'jquery';
import moment from 'moment';
import template from '../html/template.html';
import style from '../scss/core.scss';
import './extension';
import { handleGithubEvent } from './github_event';
import { Global, readStorage } from './global';
import { UrlInfo, UrlType } from './model';
import { insertJoinTime, registerEvent } from './ui_event';
import { checkUrl, fetchAuthorizedUserInfoCb, fetchUserInfoCb } from './util';

/**
 * main function
 */
export function onLoaded() {
    // adjust github ui first
    adjustGithubUI();

    // check url first
    const info = checkUrl();
    if (info === null) {
        return;
    }
    Global.info = info;

    // adjust github ui after url check
    readStorage(() => {
        adjustGithubUIAfterCheck();
    });

    // inject template and css into github
    try {
        mainInject(info);
        injectCss();
    } catch (_) { }

    // read storage from chrome
    readStorage(() => {
        // register events
        registerEvent();

        // inject events to html
        handleGithubEvent(info, Global.page);
    });
}

function adjustGithubUI() {
    // 1. modify github shadow head bar zindex
    const ghShadowHeads = $('.gh-header-shadow');
    if (ghShadowHeads && ghShadowHeads.length > 0) {
        ghShadowHeads[0].style.zIndex = '89';
    }

    // 2. insert menu items to profile menu
    const ghAvatarMenuTag = $('summary.Header-link[aria-label="View profile and more"]');
    const hoverHdr = () => {
        ghAvatarMenuTag.off('mouseenter', hoverHdr);
        const intervalHdr = setInterval(() => {
            if ($('details-menu a[data-ga-click$="your followers"]').length !== 0) {
                clearInterval(intervalHdr);
                return;
            }
            const username = $('details-menu a[data-ga-click$="Signed in as"] strong')!!.text();
            if (username === '') {
                return;
            }

            const ghYourGistTag = $('details-menu a[data-ga-click$="your gists"]');
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: `/${username}?tab=followers`,
                text: 'Your followers',
                'data-ga-click': 'Header, go to followers, text:your followers'
            }).insertBefore(ghYourGistTag);
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: `/${username}?tab=following`,
                text: 'Your following',
                'data-ga-click': 'Header, go to followings, text:your following'
            }).insertBefore(ghYourGistTag);
            $('<a>', {
                role: 'menuitem',
                class: 'dropdown-item',
                href: '/',
                text: 'Github Homepage',
                'data-ga-click': 'Header, go to homepage, text:homepage'
            }).insertAfter(ghYourGistTag);
        }, 1000);
    };
    ghAvatarMenuTag.on('mouseenter', hoverHdr);
}

function adjustGithubUIAfterCheck() {
    // 3. Update profile page counter and time
    if (Global.info.type == UrlType.User) {
        const isMe = $('div.js-profile-editable-area button').length;
        if (isMe && Global.token) {
            fetchAuthorizedUserInfoCb(Global.info.author, (info) => {
                const items = $('nav a.UnderlineNav-item');
                for (const item of items) {
                    const counter = item.getElementsByTagName('span')[0];
                    if (item.innerText.includes('Repositories') && info.totalPrivateRepos) {
                        counter.setAttribute('title', `Public: ${info.publicRepos}, private: ${info.totalPrivateRepos}, total: ${info.publicRepos + info.totalPrivateRepos}`);
                        counter.textContent = `${info.publicRepos} / ${info.publicRepos + info.totalPrivateRepos}`;
                    } else if (item.innerText.includes('Gists') && info.privateGists) {
                        counter.setAttribute('title', `Public: ${info.publicGists}, private: ${info.privateGists}, total: ${info.publicGists + info.privateGists}`);
                        counter.textContent = `${info.publicGists} / ${info.publicGists + info.privateGists}`;
                    }
                }
                if (info.createdAt) {
                    insertJoinTime(moment(info.createdAt).format('YYYY/MM/DD HH:mm'));
                }
            });
        } else {
            fetchUserInfoCb(Global.info.author, (info) => {
                if (info.createdAt) {
                    insertJoinTime(moment(info.createdAt).format('YYYY/MM/DD HH:mm'));
                }
            });
        }
    }
}

function mainInject(info: UrlInfo) {
    let renderedTemplate = template
        .replaceAll(/<!--(.|[\r\n])+?-->/, '')
        .replaceAll('${urlType}', info.type.toString())
        .replaceAll('${apiUrl}', info.apiUrl);

    const reUser = /\$\{if isUser\}((.|[\r\n])+?)\$\{endif\}/m;
    const reRepo = /\$\{if isRepo\}((.|[\r\n])+?)\$\{endif\}/m;
    if (info.type === UrlType.Repo) {
        renderedTemplate = renderedTemplate
            .replaceAll(reUser, '')
            .replaceAll(reRepo, reRepo.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorUrl)
            .replaceAll('${info.author}', info.author)
            .replaceAll('${info.repoUrl}', info.repoUrl)
            .replaceAll('${info.repo}', info.repo);
    } else {
        renderedTemplate = renderedTemplate
            .replaceAll(reRepo, '')
            .replaceAll(reUser, reUser.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorUrl)
            .replaceAll('${info.author}', info.author);
    }

    $('body').append(renderedTemplate);
}

function injectCss() {
    GMApi.GM_addStyle(style);
}
