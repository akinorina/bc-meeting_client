# ビルド環境
FROM node:lts as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .env.develop.local .env
RUN npm run build

# 本番環境
FROM nginx as production-stage
WORKDIR /app
COPY --from=build-stage /app/dist /app
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/ssl /etc/nginx/ssl
RUN rm -f /var/log/nginx/*.log
