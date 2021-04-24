import axios, { AxiosInstance, AxiosResponse } from 'axios';
import $ from 'jquery';
import { camelCase, isArray, isObject, mapKeys, mapValues } from 'lodash';
import { from, Observable } from 'rxjs';
import { Global } from './global';
import { GithubInfo, UrlInfo, UrlType } from './model';

export function checkUrl(): UrlInfo | null {
    const preserveKeywords = [
        '', 'pulls', 'issues', 'marketplace', 'explore', 'notifications',
        'new', 'login', 'organizations', 'settings', 'dashboard',
        'search', 'orgs', 'apps', 'users', 'repos', 'stars', 'account', 'assets'
    ];

    // http://xxx.github.com/xxx#xxx?xxx
    const result = /(http|https):\/\/github\.com\/(.*)/.exec(document.URL);
    if (!result) {
        return null;
    }
    var urlContent = result[2].replaceAll(/#(.*)/, '').replaceAll(/\?(.*)/, '');
    if (urlContent[urlContent.length - 1] == '/') {
        urlContent = urlContent.substring(0, urlContent.length - 1);
    }
    const endpoint = urlContent.split('/');
    if (endpoint.length === 0 || preserveKeywords.indexOf(endpoint[0]) !== -1) {
        return null;
    } else if (endpoint.length === 1) {
        if ($('.org-header-wrapper').length > 0) {
            return new UrlInfo(UrlType.Org, endpoint[0]);
        } else {
            return new UrlInfo(UrlType.User, endpoint[0]);
        }
    } else {
        return new UrlInfo(UrlType.Repo, endpoint[0], endpoint[1]);
    }
}

export function fetchGithubEvents(info: UrlInfo, page: number = 1): Observable<AxiosResponse<GithubInfo[]>> {
    const url = `${info.apiUrl}?page=${page}`;
    const headers: any = Global.token ? { 'Authorization': `Token ${Global.token}` } : {};
    const promise = myAxios().request<GithubInfo[]>({
        method: 'get',
        url,
        headers
    });
    return from(promise);
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
