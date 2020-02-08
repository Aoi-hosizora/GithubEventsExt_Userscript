import $ from 'jquery';
import template from '../html/template.html';
import './extension';
import { handleGithubEvent } from './github_event';
import { Global, readStorage } from './global';
import { UrlInfo, UrlType } from './model';
import { registerEvent } from './ui_event';
import { checkUrl } from './util';

export function onLoaded() {
    const info = checkUrl();
    adjustGithubUI(info);
    if (info === null) {
        return;
    }
    Global.info = info;

    mainInject(info);
    readStorage(() => {
        registerEvent();
        handleGithubEvent(info, Global.page);
    });
}

function adjustGithubUI(info: UrlInfo | null) {
    // modify github shadow head bar zindex
    const ghShadowHeads = $('.gh-header-shadow');
    if (ghShadowHeads && ghShadowHeads.length > 0) {
        ghShadowHeads[0].style.zIndex = '89';
    }

    // inject menu
    const ghYourGistTag = $('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="your gists"]');
    const ghUsernameTag = $('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="Signed in as"] strong');
    const username = info?.author ?? ghUsernameTag!!.text();
    $('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: `/${username}?tab=followers`,
        text: 'Your followers',
        'data-ga-click': 'Header, go to followers, text:your followers'
    }).insertBefore(ghYourGistTag!!);
    $('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: `/${username}?tab=followings`,
        text: 'Your followings',
        'data-ga-click': 'Header, go to followings, text:your followings'
    }).insertBefore(ghYourGistTag!!);
    $('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: '/',
        text: 'Github Homepage',
        'data-ga-click': 'Header, go to homepage, text:homepage'
    }).insertAfter(ghYourGistTag!!);
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
