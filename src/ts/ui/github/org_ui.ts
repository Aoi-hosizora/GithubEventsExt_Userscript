import $ from 'jquery';
import moment from "moment";
import { Global } from "@src/ts/data/global";
import { OrgInfo } from "@src/ts/data/model";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { requestOrgInfo } from "@src/ts/utils/utils";

// ==============
// org ui related
// ==============

/**
 * Adjust GitHub org profile UI with observer.
 */
export async function adjustOrgUIObservably() {
    // 1/2. request org info first
    let info: OrgInfo | undefined;
    if (Global.showOrgJoinedTime || Global.showOrgPrivateCounter) {
        try {
            info = await requestOrgInfo(Global.urlInfo.author, Global.token);
        } catch (_) { }
    }

    // 1. (configurable)
    if (Global.showOrgJoinedTime && info) {
        showOrgJoinedTime(info);
    }

    // 2. (configurable)
    if (Global.showOrgPrivateCounter && info) {
        addOrgPrivateCounters(info);
    };
}

/**
 * Add org joined time in org page.
 */
function showOrgJoinedTime(info: OrgInfo) {
    if (!info.createdAt || $('ul.vcard-details li[itemprop="create time"]').length) {
        return;
    }
    const time = moment(new Date(info.createdAt)).format('YYYY/MM/DD HH:mm');
    $('div.container-xl div.px-3.px-md-0').append(`
        <div class="mb-3 my-3 py-3 border-top">
            <ul class="vcard-details">
                <li class="vcard-detail pt-1" itemprop="create time">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-rocket">
                        ${getPathTag('rocket')}
                    </svg>
                    <span>Created at ${time}</span>
                </li>
            </ul>
        </div>
    `);
}

/**
 * Add org private counters in org page.
 */
function addOrgPrivateCounters(info: OrgInfo) {
    if (!Global.token) {
        return;
    }

    const repoCounterA = $('header.AppHeader nav a#repositories-tab');
    if (repoCounterA.length) {
        const title = `Public: ${info.publicRepos}, private: ${info.totalPrivateRepos}, total: ${info.publicRepos + info.totalPrivateRepos}`;
        repoCounterA[0].setAttribute('title', title);
        const repoCounterSpan = $('nav a#repositories-tab span:last-child');
        if (repoCounterSpan.length) {
            repoCounterSpan[0].textContent = `${info.publicRepos} / ${info.publicRepos + info.totalPrivateRepos}`;
            repoCounterSpan[0].setAttribute('title', title);
        }
    }
}
