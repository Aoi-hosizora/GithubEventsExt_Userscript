import { GMApi } from 'greasemonkey';
import { StorageFlag } from "@src/ts/data/global";

export function setStorage(flag: StorageFlag, value: string | number | boolean): Promise<void> {
    return new Promise((resolve, _) => {
        GMApi.GM_setValue(flag.toString(), value);
        resolve();
    });
}

export function getStorage<T extends string | number | boolean>(flag: StorageFlag, defaultValue: T, etc: { alsoInit?: boolean } = {}): Promise<T> {
    return new Promise((resolve, _) => {
        var value = GMApi.GM_getValue(flag.toString());
        if (value === undefined || value === null || typeof value !== typeof defaultValue) {
            if (etc.alsoInit) {
                GMApi.GM_setValue(flag.toString(), defaultValue);
            }
            resolve(defaultValue);
        } else {
            resolve(value as T);
        }
    });
}

export function removeStorage(flag: StorageFlag): Promise<void> {
    return new Promise((resolve, _) => {
        GMApi.GM_deleteValue(flag.toString());
        resolve();
    })
}
