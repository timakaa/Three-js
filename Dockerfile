FROM node:20-alpine

WORKDIR /app

COPY package.json .

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "exec", "serve", "dist", "-l", "3000", "--no-clipboard", "--single"]