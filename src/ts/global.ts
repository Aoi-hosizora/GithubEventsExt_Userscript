import { GMApi } from 'greasemonkey';
import { URLInfo } from './model';

export class Global {
    // Settings from storage
    public static token: string = '';
    public static pinned: boolean = false;
    public static width: number;

    // Some global runtime variables
    public static urlInfo: URLInfo;
    public static page: number = 1;
    public static isHovering: boolean = false;

    // Constants
    public static readonly FEEDBACK_URL: string = 'https://github.com/Aoi-hosizora/GithubEventsExt/issues';
}

export enum StorageFlag {
    TOKEN = 'ah-token',
    PINNED = 'ah-pinned',
    WIDTH = 'ah-width'
}

export async function setStorage(flag: StorageFlag, value: any): Promise<void> {
    return new Promise((resolve, _) => {
        GMApi.GM_setValue(flag.toString(), value);
        resolve();
    });
}

export async function getStorage(flag: StorageFlag): Promise<any> {
    return new Promise((resolve, _) => {
        var value = GMApi.GM_getValue(flag.toString());
        resolve(value);
    });
}

export async function removeStorage(flag: StorageFlag): Promise<void> {
    return new Promise((resolve, _) => {
        GMApi.GM_deleteValue(flag.toString());
        resolve();
    })
}

export async function readStorageToGlobal(): Promise<void> {
    return new Promise((resolve, _) => {
        Global.token = GMApi.GM_getValue(StorageFlag.TOKEN.toString());
        Global.pinned = GMApi.GM_getValue(StorageFlag.PINNED.toString());
        Global.width = GMApi.GM_getValue(StorageFlag.WIDTH.toString());
        resolve();
    });
}
