import { getStorage, removeStorage, setStorage, StorageFlag } from './global';

/**
 * Setting button clicked callback.
 */
export async function onActionClicked() {
    const token = await getStorage(StorageFlag.TOKEN);
    if (!token) {
        if (confirm('Do you want to add a token to access the private repos?')) {
            await addToken();
        } else {
            alert('You can click the extension icon to reopen this dialog.');
        }
    } else {
        await removeToken(token);
    }
}

async function addToken() {
    var token = prompt('Please enter your GitHub token: \n(To get a token, please visit https://github.com/settings/tokens.)');
    if (token === null) {
        return;
    }
    token = token.trim();
    if (!token) {
        alert('You have entered an empty token.');
    } else {
        await setStorage(StorageFlag.TOKEN, token);
        alert('Your GitHub token has been set successfully, reload this page to see changes.');
    }
}

async function removeToken(token: string) {
    const ok = confirm(`You have already set your GitHub token (${token}), do you want to remove it?`);
    if (ok) {
        await removeStorage(StorageFlag.TOKEN);
        alert('You have successfully removed GitHub token.');
    }
}
