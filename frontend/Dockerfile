# Stage 1: Build Angular app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . . 
RUN npm run build

# Stage 2: Serve Angular app with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/randomrobi /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
