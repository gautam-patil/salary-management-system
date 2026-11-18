FROM node:24-slim

# Prisma needs OpenSSL at runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# the api's postinstall generates the Prisma client, so the schema must already be copied
RUN npm ci
RUN npm run build -w @acme/web

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./prod.db"
EXPOSE 3000

# applies migrations, seeds if empty, then starts Express (API and web app)
CMD ["npm", "run", "start", "-w", "@acme/api"]
