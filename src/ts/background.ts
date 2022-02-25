import { getStorage, removeStorage, setStorage, StorageFlag } from '@src/ts/global';

export async function onActionClicked() {
    const token = await getStorage(StorageFlag.TOKEN);
    if (!token) {
        if (confirm('Do you want to setup a GitHub token to access the private repos?')) {
            await addToken();
        }
    } else {
        await removeToken(token);
    }
}

async function addToken() {
    var token = prompt('Please enter your GitHub token: \n(You can visit https://github.com/settings/token to to get token.)');
    if (token === null) {
        return;
    }
    token = token.trim();
    if (!token) {
        alert('Oops! You have entered an empty token.');
    } else {
        await setStorage(StorageFlag.TOKEN, token);
        alert('Done! Your GitHub token has been set successfully, reload this page to see changes.');
    }
}

async function removeToken(token: string) {
    const ok = confirm(`You have already set a GitHub token (${token}), do you want to remove it?`);
    if (ok) {
        await removeStorage(StorageFlag.TOKEN);
        alert('You have removed GitHub token successfully.');
    }
}
