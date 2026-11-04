FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# git doesn't keep an empty public folder, and the image copies it below
RUN mkdir -p public
# NEXT_PUBLIC_ values are written into the browser code during the build, they can't be set at runtime
ARG NEXT_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID
ARG NEXT_PUBLIC_APPLE_SIGN_IN_CLIENT_ID
ENV NEXT_PUBLIC_APPLE_SIGN_IN_CLIENT_ID=$NEXT_PUBLIC_APPLE_SIGN_IN_CLIENT_ID
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# the optimised images are cached here, and the server doesn't run as root
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
