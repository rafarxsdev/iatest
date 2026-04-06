FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN chmod -R 755 /app/dist && ls -l /app/dist/server.js

EXPOSE 3000

CMD ["node", "dist/server.js"]
