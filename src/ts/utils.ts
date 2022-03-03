import axios, { AxiosInstance, AxiosResponse } from 'axios';
import $ from 'jquery';
import { camelCase, isArray, isObject, mapKeys, mapValues } from 'lodash';
import { EventInfo, RepoContentInfo, RepoInfo, RepoTreeInfo, URLInfo, URLType, UserInfo } from '@src/ts/model';

/**
 * Check the document.URL, return null if current page is not a GitHub page.
 */
export function checkURL(): URLInfo | null {
    // extract GitHub url
    const result = /https?:\/\/github\.com(.*)?/.exec(document.URL); // https://github.com/xxx?xxx#xxx
    if (!result) {
        return null;
    }
    if (result.length <= 1) {
        return new URLInfo(URLType.OTHER);
    }
    const preservedEndpoints = [
        'pulls', 'issues', 'marketplace', 'explore', 'notifications',
        'new', 'login', 'organizations', 'settings', 'dashboard', 'features', 'codespaces',
        'search', 'orgs', 'apps', 'users', 'repos', 'stars', 'account', 'assets'
    ];
    const finalPart = result[result.length - 1].trim().replaceAll(/\/?(\?.*|#.*)?$/, '');
    const endpoints = finalPart.split('/').filter(e => !!e); // => xxx or xxx/yyy or xxx/yyy/zzz/...
    if (endpoints.length === 0 || preservedEndpoints.indexOf(endpoints[0]) !== -1) {
        return new URLInfo(URLType.OTHER);
    }

    // org or user
    if (endpoints.length === 1) { // => xxx
        const isOrg = $('div[itemtype="http://schema.org/Organization"]').length > 0;
        if (isOrg) {
            return new URLInfo(URLType.ORG, endpoints[0]);
        } else {
            const info = new URLInfo(URLType.USER, endpoints[0]);
            const isMe = $('div.js-profile-editable-area button').length > 0;
            info.extra.user = { isMe };
            return info;
        }
    }

    // repo
    const info = new URLInfo(URLType.REPO, endpoints[0], endpoints[1]);
    if (endpoints.length === 2) { // => xxx/yyy
        let ref = '';
        const refBtn = $('div.file-navigation summary:nth-child(1)');
        if (refBtn.length) {
            ref = refBtn[0].textContent?.trim() ?? '';
        }
        info.extra.repo = { isTree: true, ref: (!!ref ? ref : 'master'), path: '' };
    } else if (endpoints.length >= 4 && endpoints[2] === 'tree') { // => xxx/yyy/tree/.../
        const ref = endpoints[3];
        let path = '';
        if (endpoints.length >= 5) {
            path = endpoints.slice(4).join('/');
        }
        info.extra.repo = { isTree: true, ref, path };
    } else {
        info.extra.repo = { isTree: false, ref: '', path: '' };
    }
    console.log(info);
    return info;
}

/**
 * Use MutationObserver to observe the attributes of given HTMLElement.
 */
export function observeAttributes(el: HTMLElement, callback: (record: MutationRecord, el: Element) => void): MutationObserver {
    const observer = new MutationObserver(records => {
        records.forEach(record => {
            if (record.type === 'attributes' && record.target.nodeType == record.target.ELEMENT_NODE) {
                callback(record, record.target as Element);
            }
        });
    });
    observer.observe(el, { attributes: true });
    return observer;
}

/**
 * Get GitHub progress loader element, with fake start loading function and finish loading function.
 */
export function getGitHubProgressBar(): { el: JQuery<HTMLElement>; startLoading: () => void; finishLoading: () => void } {
    const progressBarOuter = $('span.progress-pjax-loader');
    const progressBarInner = $('span.progress-pjax-loader span');
    return {
        el: progressBarOuter,
        startLoading: () => {
            progressBarInner.attr('style', 'width: 0%; transition: width 0.4s ease 0s;');
            progressBarOuter.addClass('is-loading');
            progressBarInner.attr('style', 'width: 40%; transition: width 0.4s ease 0s;');
        },
        finishLoading: () => {
            progressBarInner.attr('style', 'width: 100%; transition: width 0.4s ease 0s;');
            setTimeout(() => {
                progressBarOuter.removeClass('is-loading');
                progressBarInner.attr('style', 'width: 0%; transition: width 0.4s ease 0s;');
            }, 450);
        },
    }
}

/**
 * Get an AxiosInstance with camelCase data parser.
 */
function myAxios(): AxiosInstance {
    const mapDeep = (data: any, callback: (v: any, k: string) => string): any => {
        if (isArray(data)) {
            return data.map(innerData => mapDeep(innerData, callback));
        }
        if (isObject(data)) {
            return mapValues(mapKeys(data, callback), val => mapDeep(val, callback));
        }
        return data;
    };
    const mapKeysCamelCase = (data: any): any => mapDeep(data, (_value: any, key: string): string => camelCase(key));

    const client = axios.create();
    client.interceptors.response.use(
        response => {
            const { data } = response;
            return { ...response, data: mapKeysCamelCase(data) };
        }
    );
    return client;
}

/**
 * Make a http request to given url and return its axios response.
 */
async function httpRequest<T>(method: 'get', url: string, token: string): Promise<AxiosResponse<T>> {
    let headers = {};
    if (token) {
        headers = { 'Authorization': `Token ${token}` };
    }
    return await myAxios().request<T>({ method, url, headers })
}

/**
 * HTTP Get user/org/repo events information.
 */
export async function requestGitHubEvents(eventAPI: string, page: number, token: string = ''): Promise<EventInfo[]> {
    const url = `${eventAPI}?page=${page}`;
    return (await httpRequest<EventInfo[]>('get', url, token)).data;
}

/**
 * HTTP Get user information.
 */
export async function requestUserInfo(user: string, token: string = ''): Promise<UserInfo> {
    const url = `https://api.github.com/users/${user}`;
    return (await httpRequest<UserInfo>('get', url, token)).data;
}

/**
 * HTTP Get repo information.
 */
export async function requestRepoInfo(user: string, repo: string, token: string = ''): Promise<RepoInfo> {
    const url = `https://api.github.com/repos/${user}/${repo}`;
    return (await httpRequest<RepoInfo>('get', url, token)).data;
}

/**
 * HTTP Get repo contents information.
 */
export async function requestRepoContents(user: string, repo: string, ref: string, path: string, token: string = ''): Promise<RepoContentInfo[]> {
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${ref}`;
    return (await httpRequest<RepoContentInfo[]>('get', url, token)).data;
}

/**
 * HTTP Get repo tree information.
 */
export async function requestRepoTreeInfo(user: string, repo: string, ref: string, token: string = ''): Promise<RepoTreeInfo> {
    const url = `https://api.github.com/repos/${user}/${repo}/git/trees/${ref}?recursive=1`;
    return (await httpRequest<RepoTreeInfo>('get', url, token)).data;
}

/**
 * Format given bytes to string in two fixed decimal digits.
 */
export function formatBytes(bytes: number): string {
    if (bytes <= 0) {
        return '0.00 B';
    }
    const b = bytes;
    if (b < 1024) {
        return `${b.toFixed(2)} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
        return `${mb.toFixed(2)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
}
