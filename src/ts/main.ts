import GMApi from 'greasemonkey';
import $ from 'jquery';
import style from '@src/scss/core.scss';
import { Global } from '@src/ts/data/storage';
import { URLType } from '@src/ts/data/model';
import { adjustGlobalUI, adjustUserUIObservably, adjustRepoUIObservably } from '@src/ts/ui/github';
import { observeChildChanged, handleGithubTurboProgressBar, checkURL } from '@src/ts/utils/utils';
import { resetSidebar, getSidebarHtml, disableBlankTargetForSidebar } from '@src/ts/ui/sidebar';
import { registerUIEvents, loadGitHubEvents } from '@src/ts/ui/ui_events';

/**
 * Adjust GitHub UI !!!
 */
export function adjustGitHubUI() {
    // 1. global UI
    adjustGlobalUI();

    function handleObservably() {
        // 2. user UI (in observation)
        if (Global.urlInfo.type == URLType.USER) {
            adjustUserUIObservably();
        }

        // 3. repo UI (in observation)
        if (Global.urlInfo.type == URLType.REPO) {
            adjustRepoUIObservably();
        }

        // 4. org UI (in observation)
        if (Global.urlInfo.type == URLType.ORG) {
            // None currently
        }
    }

    handleObservably();

    // !!! observe progress bar
    observeChildChanged($('html')[0], (record) => {
        if (record.removedNodes && handleGithubTurboProgressBar().isTurboProgressBar(record.removedNodes[0] as Element)) {
            const urlInfo = checkURL();
            if (urlInfo) {
                var oldUrlInfo = Global.urlInfo;
                Global.urlInfo = urlInfo;

                // adjust github ui
                handleObservably();

                // re-inject sidebar
                if (!Global.urlInfo.equals(oldUrlInfo)) {
                    injectSidebar();
                }
            }
        }
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
    GMApi.GM_addStyle(style);

    // 3. register sidebar's UI events
    registerUIEvents();

    // 4. start loading GitHub events
    loadGitHubEvents();
}
