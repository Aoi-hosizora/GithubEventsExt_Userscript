import { getStorage, removeStorage, setStorage, StorageFlag } from './global';

export function onBrowserActionClicked() {
    getStorage(StorageFlag.Token, data => {
        const token: string = data;
        if (!token) {
            if (confirm('Do you want to add a token to access the private repos?')) {
                addToken();
            } else {
                alert('You can click the extension icon to reopen this dialog.');
            }
        } else {
            removeToken(token);
        }
    });
}

function addToken() {
    const token = prompt('Please enter your Github token: \n(to get token, please visit https://github.com/settings/tokens)');
    if (token === null) return;
    if (token.trim().length === 0) {
        alert('You have entered an empty token.');
    } else {
        setStorage(StorageFlag.Token, token, () => {
            alert('Your Github token has been set successfully, reload this page to see changes.');
        });
    }
}

function removeToken(token: string) {
    const ok = confirm(`You have already set your Github token (${token}), want to remove it?`);
    if (ok) {
        removeStorage(StorageFlag.Token, () => {
            alert('You have successfully removed Github token.');
        });
    }
}
