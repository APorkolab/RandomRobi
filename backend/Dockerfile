FROM node:18-alpine

# Állítsuk be a munkakönyvtárat a konténerben
WORKDIR /app

# Másoljuk át a package.json és package-lock.json fájlokat a konténerbe
COPY package*.json ./

# Töröljük a meglévő node_modules és package-lock.json fájlokat
RUN rm -rf node_modules package-lock.json

# Telepítsük újra a függőségeket a konténeren belül
RUN npm install

# Másoljuk át a teljes alkalmazás kódját a konténerbe
COPY . .

# Nyissuk meg a 3000-es portot a konténeren belül
EXPOSE 3000

# Állítsuk be az indítási parancsot a konténer számára
CMD ["npm", "start"]