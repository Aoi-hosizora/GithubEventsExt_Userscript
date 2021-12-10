import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { onActionClicked } from './background';
import { Global, setStorage, StorageFlag } from './global';
import { EventInfo, URLInfo } from './model';
import { formatInfoToLi } from './sidebar_ui';
import { requestGithubEvents } from './util';

/**
 * !!! github events handler
 */
export async function loadGithubEvents(page: number = 1) {
    const ulTag = $('#ahid-list');
    showMessage(false, 'Loading...');
    var infos = await requestGithubEvents(Global.urlInfo, page);
    showMessage(false, '');
    // console.log(resp);
    const ul = $('#ahid-ul');
    infos.forEach(item => {
        const li = formatInfoToLi(item);
        if (!li) {
            return;
        }
        if (ulTag[0].children.length) {
            ulTag.append('<hr class="ah-hr" />');
        }
        const content = li
            .replaceAll('\n', '')
            .replaceAll('  ', ' ')
            .replaceAll(' </a>', '</a>') // <a "xxx"> xxx </a>
            .replaceAll('"> ', '">');
        ul.append(content);
    });
}

function loadNextGithubEvents() {
    loadGithubEvents(++Global.page);
}

export function registerUIEvents() {
    _regToggle();
    _regClick();
    _regResizeEvent();

    navStatus(Global.pinned);
    setPin(Global.pinned);
}

/**
 * show error message in ahid-message
 * show normal message in ahid-more
 */
export function showMessage(isError: boolean, message?: string) {
    const hideFlag = 'ah-hint-hide';
    const disableFlag = 'ah-a-disabled';

    const ulTag = $('#ahid-ul');
    const messageTag = $('#ahid-message');
    const moreTag = $('#ahid-more');
    const retryTag = $('#ahid-retry');

    if (isError) {
        moreTag.addClass(hideFlag);
        retryTag.removeClass(hideFlag);
        ulTag.addClass(hideFlag);
        messageTag.removeClass(hideFlag);

        messageTag.text(message!!);
    } else {
        moreTag.removeClass(hideFlag);
        retryTag.addClass(hideFlag);
        ulTag.removeClass(hideFlag);
        messageTag.addClass(hideFlag);

        if (message && message !== '') {
            moreTag.text(message);
            moreTag.addClass(disableFlag);
        } else {
            moreTag.text('More...');
            moreTag.removeClass(disableFlag);
        }
    }
}

function _regToggle() {
    $('#ahid-nav').mouseenter(() => {
        Global.isHovering = true;
    });
    $('#ahid-nav').mouseleave(() => {
        Global.isHovering = false;
        if (!Global.pinned) {
            setTimeout(() => {
                if (!Global.pinned && !Global.isHovering)
                    navStatus(false);
            }, 1000);
        }
    });

    $('#ahid-toggle').mouseenter(() => {
        navStatus(true);
    });
    $('#ahid-toggle').click(() => {
        navStatus(true);
    });
}

function _regClick() {
    $('#ahid-pin').click(() => {
        setPin(!Global.pinned);
    });

    $('#ahid-feedback').click(() => {
        window.open(Global.FEEDBACK_URL);
    });

    $('#ahid-refresh').click(() => {
        adjustMain(false);
        $('#ahid-ul').html('');
        Global.page = 1;
        loadGithubEvents();
    });

    $('#ahid-more').click(() => {
        loadNextGithubEvents();
    });

    $('#ahid-retry').click(() => {
        $('#ahid-ul').html('');
        Global.page = 1;
        loadGithubEvents();
    });

    $('#ahid-setting').click(onActionClicked);
}

function navStatus(flag: boolean) {
    const nav = $('#ahid-nav');
    const toggle = $('#ahid-toggle');
    nav.css('width', `${Global.width}px`);

    if (flag) {
        toggle.addClass('ah-hide');
        nav.addClass('ah-open');
        nav.css('right', '');
        bindResize(true);
    } else {
        toggle.removeClass('ah-hide');
        nav.removeClass('ah-open');
        nav.css('right', `-${Global.width}px`);
        bindResize(false);
    }
}

function setPin(flag: boolean) {
    if (flag) {
        $('#ahid-nav').addClass('ah-shadow');
        $('#ahid-pin').addClass('ah-pined');
    } else {
        $('#ahid-nav').removeClass('ah-shadow');
        $('#ahid-pin').removeClass('ah-pined');
    }

    Global.pinned = flag;
    setStorage(StorageFlag.PINNED, Global.pinned);
    adjustMain(false);
}

/**
 * pin & load & resize
 * @param useElWidth true only el.resize
 */
function adjustMain(useElWidth: boolean) {
    const nav = $('#ahid-nav');
    if (nav.css('left') !== '') {
        nav.css('left', '');
    }
    if (Global.pinned) {
        let to: number = Global.width;
        if (useElWidth) {
            to = nav.width()!!;
        }
        $('body').css('margin-right', `${to}px`);
    } else {
        $('body').css('margin-right', '');
    }
}

function bindResize(flag: boolean) {
    $(() => {
        const el = $('#ahid-nav');
        if (flag) {
            el.resizable({
                disabled: false,
                handles: 'w',
                minWidth: parseInt(el.css('min-width'), 10),
                maxWidth: parseInt(el.css('max-width'), 10)
            });
        } else {
            el.resizable({
                disabled: true
            });
        }
    });
}

function addOctotreeWide(_: object) {
    if ($('html').hasClass('octotree-pinned') && !($('html').hasClass('octotree-wide'))) {
        $('html').addClass('octotree-wide');
    }
}

function _regResizeEvent() {
    const el = $('#ahid-nav');
    const hdr = $('.ui-resizable-handle');
    const event = () => {
        if (Global.width !== el.width()!!) {
            Global.width = el.width()!!;
            setStorage(StorageFlag.WIDTH, Global.width);
        }
        adjustMain(false);
    };
    hdr.mouseup(event);
    el.mouseup(event);
    el.resize(() => { adjustMain(true); });

    const observer = new MutationObserver(addOctotreeWide);
    observer.observe(document.getElementsByTagName('html')[0], {
        attributes: true,
        attributeFilter: ['class'],
    });
}
