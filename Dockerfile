FROM node:20.9.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20.9.0-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000

# Add environment variables
ENV SECRET_KEY=8f42a73054b1649e8d4e6b3c7a9f0d2e5b8c1a4f7d0e3b6c9a2f5e8d1b4c7a0f3
ENV FRONTEND_URL=https://emailapp-35b26.web.app
ENV FIREBASE_STORAGE_BUCKET=emailapp-35b26.appspot.com

CMD ["node", "dist/main"]
