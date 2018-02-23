#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )"
_dockerPath="$( pwd )"
_srcPath="$( dirname "$_dockerPath" )"

_dataPath="$_dockerPath/.data"
if [ ! -d "$_dataPath" ]; then
  mkdir "$_dataPath"
fi

_netrcPath="$_dataPath/netrc"
if [ ! -f "$_netrcPath" ]; then
  touch "$_netrcPath"
fi

_npmrcPath="$_dataPath/npmrc"
if [ ! -f "$_npmrcPath" ]; then
  touch "$_npmrcPath"
fi

docker run --rm -it \
  -p "13000:3000" \
  -v "$_srcPath:/src" \
  -v "$_dataPath/global_node_modules:/usr/local/lib/node_modules" \
  -v "$_netrcPath:/root/.netrc" \
  -v "$_dataPath/npm:/root/.npm" \
  -v "$_npmrcPath:/root/.npmrc" \
  -w "/src" \
  node:9.5.0 bash
