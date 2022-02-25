if [ -f "dist/github-events.user.js" ]; then
    echo "🚀 You can visit http://localhost:5000/dist/github-events.user.js to install the extension!"
    echo ""
    python -m http.server 5000
else
    echo "🛑 Error! Could not found 'dist/github-events.user.js'. Please use 'npm run build' or 'npm run watch' to build first."
    exit 1
fi
