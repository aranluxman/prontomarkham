#!/bin/sh
# Bundle + minify the site's CSS and JS into single files (fewer requests, smaller transfer).
# Edit css/{styles,components,chat,motion}.css and js/{site,chat,motion}.js, then run:
#   sh tools/build_assets.sh
set -e
cd "$(dirname "$0")/.."
cat css/styles.css css/components.css css/chat.css css/motion.css > /tmp/pronto-all.css
npx --yes esbuild@0.28.2 /tmp/pronto-all.css --minify --outfile=css/app.min.css
cat js/site.js js/chat.js js/motion.js > /tmp/pronto-all.js
npx --yes esbuild@0.28.2 /tmp/pronto-all.js --minify --target=es2017 --outfile=js/app.min.js
