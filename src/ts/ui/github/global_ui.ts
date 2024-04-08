import $ from 'jquery';
import { Global } from "@src/ts/data/storage";
import { URLType } from "@src/ts/data/model";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { Completer, observeAttributes, observeChildChanged, getDocumentScrollYOffset } from "@src/ts/utils/utils";

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
function adjustModalDialogLayout(
    headerClassName: string,
    ifAddedChecker: (element?: Element) => boolean,
    adjustOverlayLayout: (element: JQuery<HTMLElement>, opened: boolean) => void,
): Promise<boolean> {
    const completer = new Completer<boolean>();

    const headerDiv = $(`div.${headerClassName}`); // example: AppHeader-globalBar-start
    const sidePanel = headerDiv.find('deferred-side-panel');
    if (!sidePanel.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }

    // const modalDialogOverlay = headerDiv.find('div.Overlay-backdrop--side');
    // const modalDialog = headerDiv.find('modal-dialog');
    // if (!modalDialog.length || !modalDialogOverlay.length) {
    //     completer.complete(false);
    //     return completer.future(); // unreachable
    // }

    const fragment = headerDiv.find('include-fragment');
    const modalDialog = headerDiv.find('dialog')
    if (!fragment.length || !modalDialog.length) {
        completer.complete(false);
        return completer.future(); // unreachable
    }

    // observeDialogNode(); // observe unloaded node, and than observe new node, and complete completer
    
    observeAttributes(modalDialog[0], (record, el) => {
        if (record.attributeName === 'open') {
            console.log('opened by observeUnloadedNode !!!');
            var opened = el.hasAttribute('open');
            // adjustOverlayLayout(modalDialogOverlay, opened); // adjust margin when opened
            if (opened) {
                $('body').css('overflow', 'visible !important');
            }
            // if (!opened) {
            //     // restore scroll offset, maybe a bug of GitHub
            //     document.documentElement.scrollTo({ top: getDocumentScrollYOffset() });
            // }
        }
    });

    if (!fragment[0].hasAttribute('data-loaded')) {
        observeAttributes(fragment[0], (record, _) => {
            if (record.attributeName === 'data-loaded') {
                console.log('data-loaded added !!!');
                completer.complete(true);
            }
        });
    } else {
        // observeLoadedNode(); // observe new node directly
        completer.complete(true);
    }
    return completer.future();

    // >>> two helpers functions

    // function observeDialogNode() {
    //     // 1. observe the unloaded node which will be deleted, or said, updated
    //     // adjustOverlayLayout(modalDialogOverlay, false); // adjust margin first
    //     observeAttributes(modalDialog[0], (record, el) => {
    //         if (record.attributeName === 'open') {
    //             console.log('opened by observeUnloadedNode !!!');
    //             var opened = el.hasAttribute('open');
    //             // adjustOverlayLayout(modalDialogOverlay, opened); // adjust margin when opened
    //             if (opened) {
    //                 $('body').css('overflow', 'visible !important');
    //             }
    //             // if (!opened) {
    //             //     // restore scroll offset, maybe a bug of GitHub
    //             //     document.documentElement.scrollTo({ top: getDocumentScrollYOffset() });
    //             // }
    //         }
    //     });

    //     // 2. observe the dialog helper div for node adding, and starting new observing
    //     // var loadObserver = observeChildChanged(modalDialog[0], (record) => {
    //     //     if (!record.addedNodes) {
    //     //         return;
    //     //     }

    //     //     var added = false;
    //     //     for (var node of record.addedNodes) {
    //     //         if (node.nodeName == 'scrollable-region') {
    //     //             added = true; // this node is added in interactive manner
    //     //             openObserver.disconnect();
    //     //             loadObserver.disconnect(); // after node is added, disconnect the observer
    //     //             break;
    //     //         }
    //     //         // if (ifAddedChecker(node as Element) === true) {
    //     //         // }
    //     //     }
    //     //     if (!added) {
    //     //         return;
    //     //     }

    //     //     // console.log('added, observeLoadedNode');
    //     //     // observeLoadedNode();
    //     //     completer.complete(true);
    //     // });
    // }

    // function observeLoadedNode() {
    //     // 3. observe the new node which is inserted when dialog loaded
    //     // const modalDialogOverlay = headerDiv.find('div.Overlay-backdrop--side');
    //     // const modalDialog = headerDiv.find('modal-dialog');
    //     // if (!modalDialog.length || !modalDialogOverlay.length) {
    //     //     return;
    //     // }
    //     const modalDialog = headerDiv.find('dialog')
    //     if (!modalDialog.length) {
    //         completer.complete(false);
    //         return completer.future(); // unreachable
    //     }

    //     // adjustOverlayLayout(modalDialogOverlay, true); // adjust margin first
    //     observeAttributes(modalDialog[0], (record, el) => {
    //         if (record.attributeName === 'open') {
    //             console.log('opened by observeLoadedNode !!!');
    //             var opened = el.hasAttribute('open');
    //             // adjustOverlayLayout(modalDialogOverlay, opened);
    //             if (opened) {
    //                 $('body')[0].style.overflow = 'visible !important'
    //             }
    //             // if (!opened) {
    //             //     // restore scroll offset, maybe a bug of GitHub
    //             //     document.documentElement.scrollTo({ top: getDocumentScrollYOffset() });
    //             // }
    //         }
    //     });
    // }
}

/**
 * Adjust global modal dialog for its layout.
 */
function adjustGlobalModalDialogLayout() {
    adjustModalDialogLayout(
        'AppHeader-globalBar-start',
        // (element) => element?.tagName?.toLowerCase() === 'div' && element?.classList.contains('Overlay-backdrop--side') === true,
        (element) => element?.tagName?.toLowerCase() === 'dialog' && element?.classList.contains('Overlay--placement-left') === true,
        (element, _) => {
            // const showOctotree = $('html').hasClass('octotree-show');
            // const octotree = $('nav.octotree-sidebar.octotree-github-sidebar');
            // if (showOctotree && octotree.length) {
            //     element.css('margin-left', `${octotree.width()}px`);
            // } else {
            //     element.css('margin-left', '0');
            // }
            // $('body').css('padding-right', '0');
            // $('body').css('overflow', 'initial');
        },
    );
}

/**
 * Adjust user modal dialog for its layout.
 */
function adjustUserModalDialogLayout(): Promise<boolean> {
    return adjustModalDialogLayout(
        'AppHeader-user',
        (element) => element?.tagName?.toLowerCase() === 'user-drawer-side-panel',
        (element, _) => {
            if (Global.urlInfo.type !== URLType.OTHER && Global.pinned) {
                element.css('margin-right', `${Global.width}px`);
            } else {
                element.css('margin-right', '0');
            }
            $('body').css('padding-right', '0');
            $('body').css('overflow', 'initial');
        },
    );
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
