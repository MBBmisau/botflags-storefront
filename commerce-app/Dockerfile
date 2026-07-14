FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL=postgresql://build:build@127.0.0.1/build
ARG SALEOR_API_URL=https://saleor-backend.botflags.com/graphql/
ARG APP_API_BASE_URL=https://shop.botflags.com/commerce-app
ARG STOREFRONT_URL=https://shop.botflags.com
ARG PAYSTACK_SECRET_KEY=sk_test_pending_configuration
ARG PAYSTACK_PUBLIC_KEY=pk_test_pending_configuration
ENV DATABASE_URL=$DATABASE_URL SALEOR_API_URL=$SALEOR_API_URL APP_API_BASE_URL=$APP_API_BASE_URL STOREFRONT_URL=$STOREFRONT_URL PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET_KEY PAYSTACK_PUBLIC_KEY=$PAYSTACK_PUBLIC_KEY
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
