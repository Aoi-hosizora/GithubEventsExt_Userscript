import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { handleGithubEvent, nextGithubEvent } from './github_event';
import { Global, setStorage, StorageFlag } from './global';

export function registerEvent() {
    _regToggle();
    _regClick();
    _regResizeEvent();

    navStatus(Global.isPin);
    setPin(Global.isPin);
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
        if (!Global.isPin) {
            setTimeout(() => {
                if (!Global.isPin && !Global.isHovering)
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
        setPin(!Global.isPin);
    });

    $('#ahid-feedback').click(() => {
        window.open(Global.feedbackUrl);
    });

    $('#ahid-refresh').click(() => {
        adjustMain(false);
        $('#ahid-ul').html('');
        Global.page = 1;
        handleGithubEvent(Global.info);
    });

    $('#ahid-more').click(() => {
        nextGithubEvent(Global.info);
    });

    $('#ahid-retry').click(() => {
        $('#ahid-ul').html('');
        Global.page = 1;
        handleGithubEvent(Global.info);
    });
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

    Global.isPin = flag;
    setStorage(StorageFlag.Pin, Global.isPin);
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
    if (Global.isPin) {
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

function _regResizeEvent() {
    const el = $('#ahid-nav');
    const hdr = $('.ui-resizable-handle');
    const event = () => {
        if (Global.width !== el.width()!!) {
            Global.width = el.width()!!;
            setStorage(StorageFlag.Width, Global.width);
        }
        adjustMain(false);
    };
    hdr.mouseup(event);
    el.mouseup(event);
    el.resize(() => { adjustMain(true); });
}

export function getSvgTag(type: string, rate: number = 1) {
    let svgClass: string = '';
    let svgPath: string = '';
    let svgHeight: number = 0;
    let svgWidth: number = 0;
    switch (type) {
        case 'PushEvent':
            svgClass = 'octicon-repo-push';
            svgPath = 'M4 3H3V2h1v1zM3 5h1V4H3v1zm4 0L4 9h2v7h2V9h2L7 5zm4-5H1C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h4v-1H1v-2h4v-1H2V1h9.02L11 10H9v1h2v2H9v1h2c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'CreateEvent':
            svgClass = 'octicon-repo';
            svgPath = 'M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'CreateBranchEvent':
            svgClass = 'octicon-git-branch';
            svgPath = 'M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 10];
            break;
        case 'CreateTagEvent':
        case 'ReleaseEvent':
            svgClass = 'octicon-tag';
            svgPath = 'M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'WatchEvent':
            svgClass = 'octicon-star';
            svgPath = 'M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'MemberEvent':
            svgClass = 'octicon-organization';
            svgPath = 'M16 12.999c0 .439-.45 1-1 1H7.995c-.539 0-.994-.447-.995-.999H1c-.54 0-1-.561-1-1 0-2.634 3-4 3-4s.229-.409 0-1c-.841-.621-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.442.58 2.5 3c.058 2.41-.159 2.379-1 3-.229.59 0 1 0 1s1.549.711 2.42 2.088C9.196 9.369 10 8.999 10 8.999s.229-.409 0-1c-.841-.62-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.437.581 2.495 3c.059 2.41-.158 2.38-1 3-.229.59 0 1 0 1s3.005 1.366 3.005 4z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'IssuesEvent':
            svgClass = 'octicon-issue-opened';
            svgPath = 'M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z';
            [svgHeight, svgWidth] = [16, 14];
            break;
        case 'IssueCommentEvent':
        case 'CommitCommentEvent':
            svgClass = 'octicon-comment';
            svgPath = 'M14 1H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h2v3.5L7.5 11H14c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 9H7l-2 2v-2H2V2h12v8z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'ForkEvent':
            svgClass = 'octicon-repo-forked';
            svgPath = 'M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 10];
            break;
        case 'PullRequestEvent':
            svgClass = 'octicon-git-pull-request';
            svgPath = 'M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'PullRequestReviewCommentEvent':
            svgClass = 'octicon-eye';
            svgPath = 'M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z';
            [svgHeight, svgWidth] = [16, 16];
            break;
        case 'DeleteEvent':
            svgClass = 'octicon-x';
            svgPath = 'M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'PublicEvent':
            svgClass = 'octicon-lock';
            svgPath = 'M4 13H3v-1h1v1zm8-6v7c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h1V4c0-2.2 1.8-4 4-4s4 1.8 4 4v2h1c.55 0 1 .45 1 1zM3.8 6h4.41V4c0-1.22-.98-2.2-2.2-2.2-1.22 0-2.2.98-2.2 2.2v2H3.8zM11 7H2v7h9V7zM4 8H3v1h1V8zm0 2H3v1h1v-1z';
            [svgHeight, svgWidth] = [16, 12];
            break;
        case 'GollumEvent':
            svgClass = 'octicon-book';
            svgPath = 'M3 5h4v1H3V5zm0 3h4V7H3v1zm0 2h4V9H3v1zm11-5h-4v1h4V5zm0 2h-4v1h4V7zm0 2h-4v1h4V9zm2-6v9c0 .55-.45 1-1 1H9.5l-1 1-1-1H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h5.5l1 1 1-1H15c.55 0 1 .45 1 1zm-8 .5L7.5 3H2v9h6V3.5zm7-.5H9.5l-.5.5V12h6V3z';
            [svgHeight, svgWidth] = [16, 16];
            break;
    }
    if (!svgClass) {
        return '';
    }
    svgClass = `octicon ${svgClass}`;

    let width = svgWidth;
    let height = svgHeight;
    if (rate < 1) {
        width = Math.floor(width * rate);
        height = Math.floor(height * rate);
    }

    return `
        <svg class="${svgClass}" version="1.1" aria-hidden="true" width="${width}" height="${height}" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <path class="octicon-path" fill-rule="evenodd" d="${svgPath}"></path>
        </svg>
    `;
}
