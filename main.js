// ==UserScript==
// @name         Github events
// @namespace    https://github.com/Aoi-hosizora/GithubEvents_TamperMonkey
// @version      1.0
// @description  let github shows users and repos activity events
// @author       Aoi-hosizora
// @match        http*://github.com/*
// @copyright    2020+, Aoi-hosizora

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-start
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @resource     html https://raw.githubusercontent.com/Aoi-hosizora/GithubEventsExt/master/public/options.html
// ==/UserScript==

document.addEventListener('DOMContentLoaded', () => {
    onLoaded();
});

function onLoaded() {
    console.log('Start');
    adjustGithubUi();
    mainInject();
}

function adjustGithubUi() {
    const ghShadowHeads = $('.gh-header-shadow');
    if (ghShadowHeads && ghShadowHeads.length > 0) {
        ghShadowHeads[0].style.zIndex = '89';
    }

    const ghYourGistTag = $('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="your gists"]');
    const ghUsernameTag = $('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="Signed in as"] strong');
    const username = ghUsernameTag.text();
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
        href: `/${username}?tab=followings`,
        text: 'Your followings',
        'data-ga-click': 'Header, go to followings, text:your followings'
    }).insertBefore(ghYourGistTag);
    $('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: '/',
        text: 'Github Homepage',
        'data-ga-click': 'Header, go to homepage, text:homepage'
    }).insertAfter(ghYourGistTag);
}

function mainInject() {
    // !!!
}