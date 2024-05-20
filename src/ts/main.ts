import $ from 'jquery';
import { Global } from '@src/ts/data/global';
import { URLType } from '@src/ts/data/model';
import { adjustGitHubUiObservably } from '@src/ts/ui/github';
import { observeChildChanged, handleGithubTurboProgressBar, checkURL } from '@src/ts/utils/utils';
import { resetSidebar, getSidebarHtml, disableBlankTargetForSidebar } from '@src/ts/ui/sidebar';
import { registerUIEvents, loadGitHubEvents, adjustBodyLayout, resetBodyLayout } from '@src/ts/ui/ui_events';

/**
 * Adjust GitHub UI, observably !!!
 */
export function adjustGitHubUI() {
    adjustGitHubUiObservably(); // adjust ui firstly

    // !!! observe progress bar
    observeChildChanged($('html')[0], (record) => {
        if (!record.removedNodes) {
            return;
        }
        const progressBar = handleGithubTurboProgressBar();
        if (!progressBar.isTurboProgressBar(record.removedNodes[0] as Element)) {
            return;
        }

        // update user info, re-adjust, and re-inject
        function action() {
            const urlInfo = checkURL();
            if (urlInfo) {
                var oldUrlInfo = Global.urlInfo;
                Global.urlInfo = urlInfo;

                if (urlInfo.type !== URLType.OTHER) {
                    // refresh body margin layout
                    adjustBodyLayout();
                    // re-adjust github ui
                    adjustGitHubUiObservably();
                } else {
                    // reset body margin layout
                    resetBodyLayout();
                }

                // re-inject sidebar
                if (!Global.urlInfo.equals(oldUrlInfo)) {
                    injectSidebar();
                }
            }
        }

        action();
        setTimeout(() => action(), 1000);
    });
}

/**
  * Add sidebar with events to GitHub page !!!
 */
export function injectSidebar() {
    // 1. remove previous elements and reset status
    resetSidebar();

    // 2. inject html into GitHub page
    const info = Global.urlInfo;
    if (info.type === URLType.OTHER) {
        return; // only show sidebar on user, org, repo page
    }
    $('body').append(getSidebarHtml());
    if (!Global.useBlankTarget) {
        disableBlankTargetForSidebar();
    }

    // 3. register sidebar's UI events
    registerUIEvents(
        /* extraRefreshHandler */ adjustGitHubUiObservably,
    );

    // 4. start loading GitHub events
    loadGitHubEvents();
}
