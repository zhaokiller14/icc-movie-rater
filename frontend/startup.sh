#!/bin/bash
npm install
npm run build --configuration=production
npx serve -s dist/frontend -l 8080