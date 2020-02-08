function onLoaded() {
    console.log('Start');
    adjustGithubUi();
    mainInject();
}

function adjustGithubUi() {
    const ghShadowHeads = _$('.gh-header-shadow');
    if (ghShadowHeads && ghShadowHeads.length > 0) {
        ghShadowHeads[0].style.zIndex = '89';
    }

    const ghYourGistTag = _$('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="your gists"]');
    const ghUsernameTag = _$('.dropdown-menu.dropdown-menu-sw .dropdown-item[data-ga-click$="Signed in as"] strong');
    const username = ghUsernameTag.text();
    _$('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: `/${username}?tab=followers`,
        text: 'Your followers',
        'data-ga-click': 'Header, go to followers, text:your followers'
    }).insertBefore(ghYourGistTag);
    _$('<a>', {
        role: 'menuitem',
        class: 'dropdown-item',
        href: `/${username}?tab=followings`,
        text: 'Your followings',
        'data-ga-click': 'Header, go to followings, text:your followings'
    }).insertBefore(ghYourGistTag);
    _$('<a>', {
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