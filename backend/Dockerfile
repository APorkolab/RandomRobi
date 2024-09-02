# Használjuk a Node.js Alpine verzióját, ami egy könnyű Linux disztribúció
FROM node:18-alpine

# Telepítsük a Puppeteer futtatásához szükséges függőségeket
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Állítsuk be a Puppeteer futtatásához szükséges környezeti változót
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Állítsuk be a munkakönyvtárat a konténerben
WORKDIR /app

# Másoljuk át a package.json és package-lock.json fájlokat a konténerbe
COPY package*.json ./

# Telepítsük a függőségeket a konténeren belül
RUN npm install

# Másoljuk át a teljes alkalmazás kódját a konténerbe
COPY . .

# Nyissuk meg a 3000-es portot a konténeren belül
EXPOSE 3000

# Állítsuk be az indítási parancsot a konténer számára
CMD ["npm", "start"]

ENV CREATE_TABLES=true