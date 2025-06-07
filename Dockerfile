FROM node:20.9.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN mkdir -p /app/firebase
COPY src/firebase/firebase-service-account.json /app/firebase/firebase-service-account.json

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
