#!/bin/bash
cd /home/site/wwwroot
npm install
npm run build --configuration=production
npx serve -s dist/frontend -l 8080