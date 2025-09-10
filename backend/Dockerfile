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
    yarn \
    curl

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

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV CREATE_TABLES=false

# Start the application
CMD ["npm", "start"]
