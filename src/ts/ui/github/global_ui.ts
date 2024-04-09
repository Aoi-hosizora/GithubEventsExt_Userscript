import $ from 'jquery';
import { Global } from "@src/ts/data/storage";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { Completer, observeAttributes } from "@src/ts/utils/utils";

// =================
// global ui related
// =================

/**
 * Adjust GitHub global UI without observer.
 */
export function adjustGlobalUIObservably() {
    // 1. (fixed)
    adjustHovercardZindex();

    // 2. (fixed)
    adjustGlobalModalDialogLayout();
    var menuLoaded = adjustUserModalDialogLayout();

    // 3. (configurable)
    menuLoaded.then((ok) => {
        if (ok && Global.showFollowMenuItem) {
            showFollowAvatarMenuItem();
        }
    });
}

/**
 * Adjust hovercard element for z-index.
 */
function adjustHovercardZindex() {
    const hovercard = $('div.Popover.js-hovercard-content');
    const mainDiv = $('div[data-turbo-body]');
    mainDiv.after(hovercard);
}

/**
 * Adjust modal dialog for layout.
 */
function adjustModalDialogLayout(headerClassName: string): Promise<boolean> {
    const completer = new Completer<boolean>();

    // 1. find dialog element
    const headerDiv = $(`div.${headerClassName}`); // example: AppHeader-globalBar-start
    if (!headerDiv.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }
    const fragment = headerDiv.find('include-fragment');
    const modalDialog = headerDiv.find('dialog')
    if (!fragment.length || !modalDialog.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }

    // 2. observe dialog opening, and adjust body's scrollbar
    function addOverflowYToBody() {
        const body = $('body');
        if (body.attr('style')?.includes('overflow-y: initial') !== true) {
            body.attr('style', (_, s) => {
                let orig = s || '';
                return orig + ' overflow-y: initial !important;';
            });
        }
    }
    addOverflowYToBody(); // add first
    observeAttributes(modalDialog[0], (record, el) => {
        if (record.attributeName === 'open') {
            var opened = el.hasAttribute('open');
            if (opened) {
                addOverflowYToBody(); // add when dialog is opened
            }
        }
    });

    // 3. observe data loaded, if loaded, complete completer
    if (!fragment[0].hasAttribute('data-loaded')) {
        observeAttributes(fragment[0], (record, _) => {
            if (record.attributeName === 'data-loaded') {
                completer.complete(true);
            }
        });
    } else {
        completer.complete(true);
    }
    return completer.future();
}

/**
 * Adjust global modal dialog for its layout.
 */
function adjustGlobalModalDialogLayout() {
    adjustModalDialogLayout('AppHeader-globalBar-start');
}

/**
 * Adjust user modal dialog for its layout.
 */
function adjustUserModalDialogLayout(): Promise<boolean> {
    return adjustModalDialogLayout('AppHeader-user');
}

/**
 * Add follow* menu items to avatar dropdown menu.
 */
function showFollowAvatarMenuItem() {
    var modalDialog = $('div.AppHeader-user dialog');
    var avatarMenuUl = modalDialog.find('nav[aria-label="User navigation"] ul');
    if (!avatarMenuUl.length) {
        return;
    }

    function generateMenuItem(id: string, text: string, href: string, svgPath: string) {
        return `<li data-item-id="${id}" data-targets="nav-list.items" data-view-component="true" class="ActionListItem">
            <a data-analytics-event="" test-data="${text}" href="${href}" data-view-component="true" class="ActionListContent ActionListContent--visual16">
                <span class="ActionListItem-visual ActionListItem-visual--leading">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon">
                        ${svgPath}
                    </svg>
                </span>
                <span data-view-component="true" class="ActionListItem-label">
                    ${text}
                </span>
            </a>
        </li>`;
    }

    const username = modalDialog.find('div.Overlay-header span:first-child')[0].textContent?.trim() ?? '';
    const starsMenuItem = avatarMenuUl.find('li.ActionListItem a[data-analytics-event*="YOUR_STARS"]').parent();
    if (!$('li[data-item-id="ah-avatar-followers"]').length) {
        $(generateMenuItem('ah-avatar-followers', 'Your followers', `/${username}?tab=followers`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
    if (!$('li[data-item-id="ah-avatar-following"]').length) {
        $(generateMenuItem('ah-avatar-following', 'Your following', `/${username}?tab=following`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
}
