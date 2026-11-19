FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.mjs"]
