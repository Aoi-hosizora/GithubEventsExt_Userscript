import { onLoaded } from './app';

// python -m http.server 5000
// http://localhost:5000/dist/github-events.user.js

$(() => {
    console.log('Hello world');
    onLoaded();
});
