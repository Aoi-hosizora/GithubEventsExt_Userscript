import $ from 'jquery';
import { Global } from "@src/ts/data/global";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { Completer, observeAttributes, observeChildChanged } from "@src/ts/utils/utils";

// =================
// global ui related
// =================

/**
 * Adjust GitHub global UI without observer.
 */
export function adjustGlobalUIObservably() {
    // 0. subscribe window scroll event
    $(window).on('scroll', function () {
        Global.windowScrollY = window.scrollY;
    });

    // 1. (fixed)
    adjustHovercardZindex();

    // 2. (fixed)
    adjustMenuLayout(() => {
        // 3. (configurable)
        if (Global.showFollowMenuItem) {
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
 * Adjust global and user modal dialog layout with init action.
 */
export function adjustMenuLayout(callWhenOpenUserModalDialog?: () => void) {
    adjustGlobalModalDialogLayout();
    adjustUserModalDialogLayout(() => {
        callWhenOpenUserModalDialog?.();
    });
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
function adjustUserModalDialogLayout(callWhenOpen?: () => void): Promise<boolean> {
    return adjustModalDialogLayout('AppHeader-user', { wantPrimerPortalRoot: true, callWhenOpen: callWhenOpen });
}

/**
 * Adjust modal dialog for layout.
 * For the most simplified version, visit: https://github.com/Aoi-hosizora/GithubEventsExt_Userscript/blob/83a4feb/src/ts/ui/github/global_ui.ts#L41-L88.
 */
function adjustModalDialogLayout(headerClassName: string, etc?: { wantPrimerPortalRoot: boolean, callWhenOpen?: () => void }): Promise<boolean> {
    const completer = new Completer<boolean>(); // (currently the completer is useless)

    // 1. find dialog / portalRoot element
    const headerDiv = $(`div.${headerClassName}`); // example: AppHeader-globalBar-start
    if (!headerDiv.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }
    const fragment = headerDiv.find('include-fragment');
    if (!fragment.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }
    const modalDialog = headerDiv.find('dialog');
    const primerPortalRoot = etc?.wantPrimerPortalRoot ? $('div#__primerPortalRoot__') : undefined;
    if (!modalDialog.length && !primerPortalRoot?.length) {
        if (etc?.wantPrimerPortalRoot) { // observe body to get __primerPortalRoot__
            const observer = observeChildChanged(document.body, (record) => {
                if (record.addedNodes && record.addedNodes.length && record.addedNodes[0] instanceof HTMLElement) {
                    const node = record.addedNodes[0] as HTMLElement;
                    if (node.id === '__primerPortalRoot__') {
                        adjustModalDialogLayout(headerClassName, etc); // call this function again when node is inserted
                        observer.disconnect();
                    }
                }
            });
        }
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
    addOverflowYToBody(); // add overflow y first
    if (modalDialog.length) {
        observeAttributes(modalDialog[0], (record, el) => {
            if (record.attributeName === 'open') {
                var opened = el.hasAttribute('open');
                if (opened) {
                    addOverflowYToBody(); // add overflow y when dialog is opened
                }
            }
        });
    }
    if (primerPortalRoot?.length) {
        const dialogSelector = 'div[data-position-regular="right"][role="dialog"]';
        const marginRight = Global.pinned ? `${Global.width}px` : `0px`;
        primerPortalRoot.find(dialogSelector)?.css('margin-right', marginRight); // add margin right first
        etc?.callWhenOpen?.(); // call action first (checking is necessary)
        observeChildChanged(primerPortalRoot[0], (el) => {
            if (el.addedNodes.length) {
                const rightDialog = primerPortalRoot.find(dialogSelector);
                if (rightDialog.length) {
                    addOverflowYToBody(); // add when dialog is opened
                    if (Global.pinned) {
                        rightDialog.css('margin-right', marginRight); // add margin right to __primerPortalRoot__
                    }
                    etc?.callWhenOpen?.(); // call action when dialog is opened
                }
            }
            if (el.removedNodes.length && Global.windowScrollY) {
                window.scrollTo({ top: Global.windowScrollY }); // restore last scroll offset when dialog closed
            }
        });
    }

    // 3. observe data loaded, if loaded, complete completer (currently this is useless)
    if (!fragment[0].hasAttribute('data-loaded')) {
        const observer = observeAttributes(fragment[0], (record, _) => {
            if (record.attributeName === 'data-loaded') {
                completer.complete(true);
                observer.disconnect();
            }
        });
    } else {
        completer.complete(true);
    }
    return completer.future();
}

/**
 * Add follow* menu items to avatar dropdown menu.
 */
function showFollowAvatarMenuItem() {
    var modalDialog = $('div#__primerPortalRoot__ div[data-position-regular="right"][role="dialog"]');
    if (!modalDialog.length) {
        return;
    }
    var avatarMenuUl = modalDialog.find('ul');
    if (!avatarMenuUl.length) {
        return;
    }

    function generateMenuItem(id: string, text: string, href: string, svgPath: string) {
        // use old li tag structure yet (is not necessary to update :P)
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

    const username = modalDialog.find('div.lh-condensed div.text-bold div[title]')[0].textContent?.trim() ?? '';
    const starsMenuItem = avatarMenuUl.find('li a[href*="=stars"]').parent();
    if (!$('li[data-item-id="ah-avatar-followers"]').length) {
        $(generateMenuItem('ah-avatar-followers', 'Your followers', `/${username}?tab=followers`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
    if (!$('li[data-item-id="ah-avatar-following"]').length) {
        $(generateMenuItem('ah-avatar-following', 'Your following', `/${username}?tab=following`, getPathTag('people'))).insertAfter(starsMenuItem);
    }
}
