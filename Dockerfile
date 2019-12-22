FROM arm32v7/node:12.14.0-alpine
WORKDIR /usr/src/app
RUN mkdir db

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
      \
      # Cleanup
      && apk del --no-cache make gcc g++ python binutils-gold gnupg libstdc++ \
      && rm -rf /usr/include \
      && rm -rf /var/cache/apk/* /root/.node-gyp /usr/share/man /tmp/*

ENV NODE_ENV="production"
ENV DB_PATH=db/sinthorn.db

COPY package*.json ./
COPY index.js .
COPY src ./src
RUN npm install

CMD [ "node", "index.js" ]