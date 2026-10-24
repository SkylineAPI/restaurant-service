FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Run as the unprivileged user shipped with the node image
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
