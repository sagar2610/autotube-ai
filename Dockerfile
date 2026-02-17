FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json .eslintrc.cjs .prettierrc vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY configs ./configs
COPY .env.example ./.env.example

RUN pnpm install --frozen-lockfile=false
RUN pnpm build

CMD ["pnpm", "run", "start"]
