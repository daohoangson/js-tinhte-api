# https://github.com/nodejs/Release
FROM node:14.16.0

RUN apt-get update

RUN apt-get install -y chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
USER node
