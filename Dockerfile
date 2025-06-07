FROM node:20.9.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD sh -c "mkdir -p /app/firebase && echo \"$FIREBASE_SERVICE_ACCOUNT_JSON\" > /app/firebase/firebase-service-account.json && node dist/main"
