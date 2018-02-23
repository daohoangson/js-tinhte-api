#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )"
_dockerPath="$( pwd )"
_srcPath="$( dirname "$_dockerPath" )"

docker run --rm -it \
  -p "3000:3000" \
  -v "$_srcPath:/src" \
  -v "$_dockerPath/.data/global_node_modules:/usr/local/lib/node_modules" \
  -v "$_dockerPath/.data/npm:/root/.npm" \
  -w "/src" \
  node:9.5.0 bash
