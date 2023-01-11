import GMApi from 'greasemonkey';
import $ from 'jquery';
import template from '@src/html/template.html';
import style from '@src/scss/core.scss';
import { Global } from '@src/ts/global';
import { URLType } from '@src/ts/model';
import { getPathTag } from '@src/ts/sidebar_ui';
import { adjustGlobalUI, adjustRepoUIObservably, adjustUserUIObservably } from '@src/ts/ui_adjust';
import { loadGitHubEvents, registerUIEvents } from '@src/ts/ui_events';
import { checkURL, handleGithubTurboProgressBar, observeChildChanged } from '@src/ts/utils';

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
    if ($('div#ahid-toggle').length) {
        $('div#ahid-toggle').remove();
        $('nav#ahid-nav').remove();
        Global.page = 1;
    }

    // 2. inject html into GitHub page
    const info = Global.urlInfo;
    if (info.type === URLType.OTHER) {
        return; // only show sidebar on user, org, repo page
    }
    $('body').append(getSidebarHtml());
    if (!Global.useBlankTarget) {
        $('nav#ahid-nav a[target="_blank"]').removeAttr('target');
    }
    GMApi.GM_addStyle(style);

    // 3. register sidebar's UI events
    registerUIEvents();

    // 4. start loading GitHub events
    loadGitHubEvents();
}

/**
 * Get and format sidebar html from template.
 */
function getSidebarHtml(): string {
    const info = Global.urlInfo;
    let renderedTemplate = template
        .replaceAll(/<!--[\s\S]+?-->/, '')
        .replaceAll('${urlType}', info.type.toString())
        .replaceAll('${apiUrl}', info.eventAPI)
        .replaceAll('${checkedPath}', getPathTag('checked'))
        .replaceAll('${feedbackUrl}', Global.FEEDBACK_URL);

    const reAuthor = /\$\{if isAuthor\}([\s\S]+?)\$\{endif\}/m;
    const reRepo = /\$\{if isRepo\}([\s\S]+?)\$\{endif\}/m;
    if (info.type === URLType.REPO) {
        renderedTemplate = renderedTemplate
            .replaceAll(reAuthor, '')
            .replaceAll(reRepo, reRepo.exec(renderedTemplate)![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author)
            .replaceAll('${info.repoUrl}', info.repoURL)
            .replaceAll('${info.repo}', info.repo);
    } else {
        renderedTemplate = renderedTemplate
            .replaceAll(reRepo, '')
            .replaceAll(reAuthor, reAuthor.exec(renderedTemplate)![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author);
    }

    return renderedTemplate;
}
