import axios, { AxiosInstance, AxiosResponse } from 'axios';
import $ from 'jquery';
import { camelCase, isArray, isObject, mapKeys, mapValues } from 'lodash';
import { from, Observable } from 'rxjs';
import { Global } from './global';
import { RepoInfo, UrlInfo, UrlType, UserInfo } from './model';

export function checkUrl(): UrlInfo | null {
    const preserveKeywords = [
        '', 'pulls', 'issues', 'marketplace', 'explore', 'notifications',
        'new', 'login', 'organizations', 'settings', 'dashboard', 'features', 'codespaces',
        'search', 'orgs', 'apps', 'users', 'repos', 'stars', 'account', 'assets'
    ];

    // http://xxx.github.com/xxx#xxx?xxx
    const result = /https?:\/\/github\.com\/(.*)/.exec(document.URL);
    if (!result) {
        return null;
    }
    var urlContent = result[result.length - 1].replaceAll(/#.*/, '').replaceAll(/\?.*/, '').replaceAll(/\/$/, '');
    // xxx/yyy or xxx
    const endpoint = urlContent.split('/');

    if (endpoint.length === 0 || preserveKeywords.indexOf(endpoint[0]) !== -1) {
        return null;
    }
    if (endpoint.length === 1) {
        if ($('div[itemtype="http://schema.org/Organization"]').length > 0) {
            return new UrlInfo(UrlType.Org, endpoint[0]);
        }
        return new UrlInfo(UrlType.User, endpoint[0]);
    }
    return new UrlInfo(UrlType.Repo, endpoint[0], endpoint[1]);
}

export function fetchGithubEvents(info: UrlInfo, page: number = 1): Observable<AxiosResponse<RepoInfo[]>> {
    const url = `${info.apiUrl}?page=${page}`;
    const headers: any = Global.token ? { 'Authorization': `Token ${Global.token}` } : {};
    const promise = myAxios().request<RepoInfo[]>({
        method: 'get',
        url,
        headers
    });
    return from(promise);
}

export function fetchUserInfoCb(user: string, callback: (info: UserInfo) => any) {
    const url = `https://api.github.com/users/${user}`;
    const promise = myAxios().request<UserInfo>({
        method: 'get',
        url,
    });
    from(promise).subscribe({
        next(resp: AxiosResponse<UserInfo>) {
            callback(resp.data);
        },
        error(_) { }
    });
}

export function fetchAuthorizedUserInfoCb(user: string, callback: (info: UserInfo) => any) {
    const url = `https://api.github.com/users/${user}`;
    const headers: any = Global.token ? { 'Authorization': `Token ${Global.token}` } : {};
    const promise = myAxios().request<UserInfo>({
        method: 'get',
        url,
        headers
    });
    from(promise).subscribe({
        next(resp: AxiosResponse<UserInfo>) {
            callback(resp.data);
        },
        error(_) { }
    });
}

function myAxios(): AxiosInstance {
    const mapDeep = (data: any, callback: (v: any, k: string) => string): any => {
        if (isArray(data)) {
            return data.map(innerData => mapDeep(innerData, callback));
        } else if (isObject(data)) {
            return mapValues(mapKeys(data, callback), val => mapDeep(val, callback));
        } else {
            return data;
        }
    };
    const mapKeysCamelCase = (data: any): any =>
        mapDeep(data, (_value: any, key: string): string => camelCase(key));

    const client = axios.create();
    client.interceptors.response.use(
        response => {
            const { data } = response;
            return { ...response, data: mapKeysCamelCase(data) };
        }
    );
    return client;
}
