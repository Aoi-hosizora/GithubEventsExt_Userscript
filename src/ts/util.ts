import axios, { AxiosInstance } from 'axios';
import $ from 'jquery';
import { camelCase, isArray, isObject, mapKeys, mapValues } from 'lodash';
import { EventInfo, URLInfo, URLType, UserInfo } from './model';

/**
 * Check the document.URL, return null if current page is not a github page.
 */
export function checkURL(): URLInfo | null {
    const preservedEndpoint = [
        'pulls', 'issues', 'marketplace', 'explore', 'notifications',
        'new', 'login', 'organizations', 'settings', 'dashboard', 'features', 'codespaces',
        'search', 'orgs', 'apps', 'users', 'repos', 'stars', 'account', 'assets'
    ];

    // https://github.com/xxx#xxx?xxx
    const result = /https?:\/\/github\.com\/(.*)/.exec(document.URL);
    if (!result) {
        return null;
    }
    var endpoint = result[result.length - 1].replaceAll(/(#.*|\?.*|\/$)/, '');
    const endpoints = endpoint.split('/'); // xxx/yyy or xxx

    if (endpoints.length === 0 || preservedEndpoint.indexOf(endpoints[0]) !== -1) {
        return new URLInfo(URLType.OTHER);
    }
    if (endpoints.length === 1) {
        if ($('div[itemtype="http://schema.org/Organization"]').length > 0) {
            return new URLInfo(URLType.ORG, endpoints[0]);
        } else {
            return new URLInfo(URLType.USER, endpoints[0]);
        }
    } else {
        return new URLInfo(URLType.REPO, endpoints[0], endpoints[1]);
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
 * HTTP Get user/org/repo events information.
 */
export async function requestGithubEvents(info: URLInfo, page: number, token: string = ''): Promise<EventInfo[]> {
    const url = `${info.eventAPI}?page=${page}`;
    const headers: any = token ? { 'Authorization': `Token ${token}` } : {};
    const resp = await myAxios().request<EventInfo[]>({
        method: 'get', url, headers
    });
    return resp.data;
}

/**
 * HTTP Get user information.
 */
export async function requestUserInfo(user: string, token: string = ''): Promise<UserInfo> {
    const url = `https://api.github.com/users/${user}`;
    const headers: any = token ? { 'Authorization': `Token ${token}` } : {};
    const resp = await myAxios().request<UserInfo>({
        method: 'get', url, headers
    });
    return resp.data;
}
