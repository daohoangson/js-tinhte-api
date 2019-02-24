#!/bin/sh

set -e

npm install && npx nwb build-demo

# hack: remove `src` from now.sh build output
rm -rf demo/src

# hack: rename `dist` -> `demo` for cosmetic reason
mv demo/dist demo/demo
