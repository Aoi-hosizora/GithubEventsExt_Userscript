import $ from 'jquery';
import moment from "moment";
import { Global } from "@src/ts/data/global";
import { UserInfo } from "@src/ts/data/model";
import { getPathTag } from "@src/ts/ui/sidebar/svg_tag";
import { requestUserInfo } from "@src/ts/utils/utils";

// ===============
// user ui related
// ===============

/**
 * Adjust GitHub user profile UI with observer.
 */
export async function adjustUserUIObservably() {
    // 1. (configurable)
    if (Global.centerFollowText) {
        centerUserFollowText();
    }

    // 2/3. request user info first
    let info: UserInfo | undefined;
    if (Global.showJoinedTime || Global.showUserPrivateCounter) {
        try {
            info = await requestUserInfo(Global.urlInfo.author, Global.token);
        } catch (_) { }
    }

    // 2. (configurable)
    if (Global.showJoinedTime && info) {
        showUserJoinedTime(info);
    }

    // 3. (configurable)
    if (Global.showUserPrivateCounter && info) {
        addUserPrivateCounters(info);
    };
}

/**
 * Center user follow* text in user page.
 */
function centerUserFollowText() {
    $('div.js-profile-editable-area div.flex-md-order-none').css('text-align', 'center');
}

/**
 * Add user joined time in user page.
 */
function showUserJoinedTime(info: UserInfo) {
    if (!info.createdAt || $('ul.vcard-details li[itemprop="join time"]').length) {
        return;
    }
    const time = moment(new Date(info.createdAt)).format('YYYY/MM/DD HH:mm');
    $('ul.vcard-details').append(
        `<li class="vcard-detail pt-1" itemprop="join time">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-rocket">
                ${getPathTag('rocket')}
            </svg>
            <span>Joined at ${time}</span>
        </li>`
    );
}

/**
 * Add user private counters in user page.
 */
function addUserPrivateCounters(info: UserInfo) {
    if (!Global.token || !Global.urlInfo.extra.user!.isMe) {
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

    const gistCounterA = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child');
    if (gistCounterA.length && gistCounterA[0].textContent?.includes('Gists') == true) {
        const title = `Public: ${info.publicGists}, private: ${info.privateGists}, total: ${info.publicGists + info.privateGists}`;
        gistCounterA[0].setAttribute('title', title);
        let gistCounterSpan = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child span:last-child');
        if (!gistCounterSpan.length) {
            gistCounterA.append('<span data-view-component="true" class="Counter" />');
            gistCounterSpan = $('header.AppHeader nav ul.UnderlineNav-body>a.UnderlineNav-item:last-child span:last-child');
        }
        if (gistCounterSpan.length) {
            gistCounterSpan[0].textContent = `${info.publicGists} / ${info.publicGists + info.privateGists}`;
            gistCounterSpan[0].setAttribute('title', title);
        }
    }
}
