import GMApi from 'greasemonkey';
import $ from 'jquery';
import template from '@src/html/template.html';
import style from '@src/scss/core.scss';
import { Global } from '@src/ts/global';
import { URLType } from '@src/ts/model';
import { getPathTag } from '@src/ts/sidebar_ui';
import { adjustGlobalUI, adjustRepoUIObservably, adjustUserUIObservably } from '@src/ts/ui_adjust';
import { loadGitHubEvents, registerUIEvents } from '@src/ts/ui_events';
import { checkURL, getGitHubProgressBar, observeAttributes } from '@src/ts/utils';

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
    observeAttributes(getGitHubProgressBar().el[0], (record, el) => {
        if (record.attributeName === 'class' && !el.classList.contains("is-loading")) {
            const urlInfo = checkURL();
            if (urlInfo) {
                Global.urlInfo = urlInfo;
                handleObservably();
            }
        }
    });
}

/**
  * Add sidebar to GitHub !!!
 */
export function injectSidebar() {
    const info = Global.urlInfo;
    if (info.type === URLType.OTHER) {
        // only show sidebar on user, org, repo page
        return;
    }

    // 1. inject html into GitHub page
    $('body').append(getSidebarHtml());
    GMApi.GM_addStyle(style);

    // 2. register sidebar's UI events
    registerUIEvents();

    // 3. start loading GitHub events
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
            .replaceAll(reRepo, reRepo.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author)
            .replaceAll('${info.repoUrl}', info.repoURL)
            .replaceAll('${info.repo}', info.repo);
    } else {
        renderedTemplate = renderedTemplate
            .replaceAll(reRepo, '')
            .replaceAll(reAuthor, reAuthor.exec(renderedTemplate)!![1])
            .replaceAll('${info.authorUrl}', info.authorURL)
            .replaceAll('${info.author}', info.author);
    }

    return renderedTemplate;
}
