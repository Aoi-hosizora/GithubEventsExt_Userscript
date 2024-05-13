import $ from 'jquery';
import template from '@src/html/template.html';
import { URLType } from '@src/ts/data/model';
import { Global } from '@src/ts/data/global';
import { getPathTag } from '@src/ts/ui/sidebar/svg_tag';

// ======================
// inject sidebar related
// ======================

/**
 * Get and format sidebar html from template.
 */
export function getSidebarHtml(): string {
    const info = Global.urlInfo;
    let renderedTemplate = template
        .replaceAll(/<!--[\s\S]+?-->/, '')
        .replaceAll('${urlType}', info.type.toString().capital())
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

/**
 * Remove sidebar if existed before injecting.
 */
export function resetSidebar() {
    if ($('div#ahid-toggle').length) {
        $('div#ahid-toggle').remove();
        $('nav#ahid-nav').remove();
        Global.page = 1;
    }
}

/**
 * Do not use blank target for a tag.
 */
export function disableBlankTargetForSidebar() {
    $('nav#ahid-nav a[target="_blank"]').removeAttr('target');
}
