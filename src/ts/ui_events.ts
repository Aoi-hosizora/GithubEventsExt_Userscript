import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { onActionClicked } from './background';
import { Global, setStorage, StorageFlag } from './global';
import { EventInfo } from './model';
import { formatInfoToLi } from './sidebar_ui';
import { requestGithubEvents } from './util';

// ===============
// request related
// ===============

/**
 * Start loading the specific page of github events !!!
 */
export async function loadGithubEvents() {
    const ulTag = $('#ahid-list');
    if (Global.page == 1) {
        ulTag.html('');
    }

    // loading
    switchDisplayMode({ isLoading: true, isError: false });
    var infos: EventInfo[];
    try {
        infos = await requestGithubEvents(Global.urlInfo.eventAPI, Global.page, Global.token);
    } catch (ex) {
        if (Global.page === 1) {
            switchDisplayMode({ isLoading: false, isError: true, errorMessage: ex as string });
        }
        return;
    }

    // data got
    switchDisplayMode({ isLoading: false, isError: false });
    infos.forEach(info => {
        const li = formatInfoToLi(info);
        if (!li) {
            return;
        }
        if (ulTag[0].children.length) {
            ulTag.append('<hr class="ah-hr" />');
        }
        ulTag.append(li);
    });
}

/**
 * Start loading next page of github events.
 */
async function loadNextGithubEvents() {
    ++Global.page;
    await loadGithubEvents();
}

/**
 * Switch display mode, such as "Loading..." or "Mode..." or "Something error".
 */
function switchDisplayMode(arg: { isLoading: boolean, isError: boolean, errorMessage?: string }) {
    const messageTag = $('#ahid-message'), ulTag = $('#ahid-list'),
        moreTag = $('#ahid-more'), loadingTag = $('#ahid-loading'), retryTag = $('#ahid-retry');

    const hide = (tag: JQuery<HTMLElement>) => tag.addClass('ah-body-hide');
    const show = (tag: JQuery<HTMLElement>) => tag.removeClass('ah-body-hide');
    if (arg.isLoading) {
        hide(messageTag);
        hide(moreTag);
        hide(retryTag);
        show(ulTag);
        show(loadingTag);
    } else if (arg.isError) {
        hide(ulTag);
        hide(moreTag);
        hide(loadingTag);
        messageTag.text(arg.errorMessage ?? 'Something error.');
        show(messageTag);
        show(retryTag);
    } else {
        hide(messageTag);
        hide(loadingTag);
        hide(retryTag);
        show(ulTag);
        show(moreTag);
    }
}

// =================
// ui events related
// =================

/**
 * Register sidebar's UI events !!!
 */
export function registerUIEvents() {
    // toggle and nav (sidebar) events
    $('#ahid-toggle').on('mouseenter', () => showSidebar(true));
    $('#ahid-toggle').on('click', () => showSidebar(true));
    $('#ahid-nav').on('mouseenter', () => Global.isHovering = true);
    $('#ahid-nav').on('mouseleave', () => {
        Global.isHovering = false;
        if (!Global.pinned) {
            setTimeout(() => (!Global.pinned && !Global.isHovering) ? showSidebar(false) : null, 1000);
        }
    });

    // buttons events
    $('#ahid-pin').on('click', () => pinSidebar(!Global.pinned));
    $('#ahid-feedback').on('click', () => window.open(Global.FEEDBACK_URL));
    $('#ahid-refresh').on('click', () => { adjustBodyLayout(); Global.page = 1; loadGithubEvents(); });
    $('#ahid-more').on('click', () => loadNextGithubEvents());
    $('#ahid-retry').on('click', () => { Global.page = 1; loadGithubEvents(); });
    $('#ahid-setting').on('click', () => onActionClicked());

    // resize events
    registerResizeEvent();

    // set sidebar status
    showSidebar(Global.pinned);
    pinSidebar(Global.pinned);
}

/**
 * Show the sidebar needShow flag is true, otherwise hide the sidebar.
 */
function showSidebar(needShow: boolean) {
    const navTag = $('#ahid-nav');
    const toggleTag = $('#ahid-toggle');
    navTag.css('width', `${Global.width}px`);
    if (needShow) {
        toggleTag.addClass('ah-toggle-hide');
        navTag.addClass('ah-nav-open');
        navTag.css('right', '');
        enableResizing(true);
    } else {
        toggleTag.removeClass('ah-toggle-hide');
        navTag.removeClass('ah-nav-open');
        navTag.css('right', `-${Global.width}px`);
        enableResizing(false);
    }
}

/**
 * Pin the sidebar needPin flag is true, otherwise hide the sidebar.
 */
function pinSidebar(needPin: boolean) {
    const navTag = $('#ahid-nav');
    const pinTag = $('#ahid-pin');
    if (needPin) {
        navTag.addClass('ah-shadow');
        pinTag.addClass('ah-pined');
    } else {
        navTag.removeClass('ah-shadow');
        pinTag.removeClass('ah-pined');
    }
    Global.pinned = needPin;
    setStorage(StorageFlag.PINNED, Global.pinned);
    adjustBodyLayout();
}

// =========================
// resize and adjust related
// =========================

/**
 * Adjust body's layout (margin-right), used when pin/refresh button is clicked or user is resizing.
 */
function adjustBodyLayout(resizing: boolean = false) {
    const navTag = $('#ahid-nav');
    navTag.css('left', '');
    if (Global.pinned) {
        const to = resizing ? navTag.width()!! : Global.width;
        $('body').css('margin-right', `${to}px`);
    } else {
        $('body').css('margin-right', '');
    }
}

/**
 * Register resize event.
 */
function registerResizeEvent() {
    const navTag = $('#ahid-nav');
    const hdlTag = $('.ui-resizable-handle');
    const event = () => {
        if (Global.width !== navTag.width()!!) {
            Global.width = navTag.width()!!;
            setStorage(StorageFlag.WIDTH, Global.width);
        }
        adjustBodyLayout(false);
    };

    navTag.on('resize', () => adjustBodyLayout(true));
    navTag.on('mouseup', event);
    hdlTag.on('mouseup', event);
}

/**
 * Enable resizing if flag set to true, otherwise disable resizing.
 */
function enableResizing(enable: boolean) {
    $(() => {
        const navTag = $('#ahid-nav');
        if (enable) {
            navTag.resizable({
                disabled: false,
                handles: 'w',
                minWidth: parseInt(navTag.css('min-width'), 10),
                maxWidth: parseInt(navTag.css('max-width'), 10)
            });
        } else {
            navTag.resizable({
                disabled: true
            });
        }
    });
}
