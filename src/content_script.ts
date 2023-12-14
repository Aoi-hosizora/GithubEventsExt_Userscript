import '@src/ts/utils/extensions';
import $ from 'jquery';
import { Global, readStorageToGlobal } from '@src/ts/data/storage';
import { adjustGitHubUI, injectSidebar } from '@src/ts/main';
import { checkURL } from '@src/ts/utils/utils';

// python -m http.server 5000
// http://localhost:5000/dist/github-events.user.js

$(() => {
    onLoaded();
});

/**
 * Main function.
 */
async function onLoaded() {
    // 1. check url first
    const info = checkURL();
    if (!info) {
        return;
    }
    Global.urlInfo = info;

    // 2. load settings from storage
    await readStorageToGlobal();

    // 3. adjust GitHub UI
    adjustGitHubUI();

    // 4. inject sidebar to GitHub
    injectSidebar();
}
