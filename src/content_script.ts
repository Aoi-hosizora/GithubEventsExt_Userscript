import './ts/extension';
import $ from 'jquery';
import { checkURL } from './ts/util';
import { Global, readStorageToGlobal } from './ts/global';
import { adjustGithubUI, injectSidebar } from './ts/main';

// python -m http.server 5000
// http://localhost:5000/dist/github-events.user.js

$(() => {
    onLoaded();
});

/**
 * Main function.
 */
async function onLoaded() {
    // check url first
    const info = checkURL();
    if (!info) {
        return;
    }
    Global.urlInfo = info;

    // load settings from chrome storage
    await readStorageToGlobal();

    // adjust github ui
    adjustGithubUI();

    // add sidebar to github 
    injectSidebar();
}
