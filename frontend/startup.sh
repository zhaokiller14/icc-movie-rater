#!/bin/bash
npm install

# Build Angular
npm run build --configuration=production

# Check where files actually are
echo "Checking build output..."
find . -name "index.html" -type f

# If files are in dist/browser, move them
if [ -d "dist/browser" ]; then
    echo "Moving files from dist/browser to dist/frontend..."
    mkdir -p dist/frontend
    cp -r dist/browser/* dist/frontend/
fi

# Serve from correct location
if [ -f "dist/frontend/index.html" ]; then
    npx serve -s dist/frontend -l $PORT --single
elif [ -f "dist/browser/index.html" ]; then
    npx serve -s dist/browser -l $PORT --single
else
    echo "ERROR: No index.html found!"
    exit 1
fi