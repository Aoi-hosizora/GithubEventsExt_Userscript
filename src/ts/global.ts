import { GMApi } from 'greasemonkey';
import { UrlInfo } from './model';

export class Global {
    public static token: string = '';
    public static isPin: boolean = false;
    public static width: number;
    public static isHovering: boolean = false;
    public static feedbackUrl: string = 'https://github.com/Aoi-hosizora/GithubEventsExt/issues';

    public static page: number = 1;
    public static info: UrlInfo;
}

export enum StorageFlag {
    Token = 'ah-token',
    Pin = 'ah-is-pin',
    Width = 'ah-width'
}

export function setStorage(flag: StorageFlag, value: any, callback?: () => void) {
    GMApi.GM_setValue(flag.toString(), value);
    if (callback) {
        callback();
    }
}

export function readStorage(callback: () => void) {
    Global.token = GMApi.GM_getValue(StorageFlag.Token.toString());
    Global.isPin = GMApi.GM_getValue(StorageFlag.Pin.toString());
    Global.width = GMApi.GM_getValue(StorageFlag.Width.toString());
    callback();
}

export function getStorage(flag: StorageFlag, callback: (item: any) => void) {
    callback(GMApi.GM_getValue(flag.toString()));
}

export function removeStorage(flag: StorageFlag, callback?: () => void) {
    GMApi.GM_deleteValue(flag.toString());
    if (callback) {
        callback();
    }
}
