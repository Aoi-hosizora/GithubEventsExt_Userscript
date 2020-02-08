// ==UserScript==
// @name         Github events
// @namespace    https://github.com/Aoi-hosizora/GithubEvents_TamperMonkey
// @version      1.0.0
// @description  let github shows users and repos activity events
// @author       Aoi-hosizora
// @match        http*://github.com/*
// @copyright    2020+, Aoi-hosizora

// @noframes
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-start
// @require      https://vuejs.org/js/vue.min.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      http://127.0.0.1:5000/main.js
// ==/UserScript==

// http://localhost:5000/github-events.user.js

const _$ = $.noConflict(true);

(() => {
    'use strict';
    onLoaded();
})();