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

# https://github.com/nodejs/Release
_nodejsVersionLTS='8.12.0'

docker run --rm -it \
  -p "13000:3000" \
  -v "$_srcPath:/src" \
  -v "$_netrcPath:/root/.netrc" \
  -v "$_dataPath/npm:/root/.npm" \
  -v "$_npmrcPath:/root/.npmrc" \
  -w "/src" \
  "node:$_nodejsVersionLTS" bash
