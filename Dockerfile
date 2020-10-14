FROM node:14-buster
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 8020

CMD npx ts-node entry.ts
