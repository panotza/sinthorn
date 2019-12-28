FROM arm32v7/node:12.14.0-alpine
WORKDIR /usr/src/app
RUN mkdir db

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV NODE_ENV="production"
ENV DB_PATH=db/sinthorn.db

COPY package*.json ./
COPY index.js .
COPY src ./src
RUN npm install

CMD [ "node", "index.js" ]