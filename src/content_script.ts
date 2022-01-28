import './ts/extension';
import $ from 'jquery';
import { Global, readStorageToGlobal } from './ts/global';
import { adjustGithubUI, injectSidebar } from './ts/main';
import { checkURL } from './ts/util';

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

    // 2. load settings from tamper monkey storage
    await readStorageToGlobal();

    // 3. adjust github ui
    adjustGithubUI();

    // 4. add sidebar to github 
    injectSidebar();
}
