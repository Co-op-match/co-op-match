# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g serve
COPY --from=build /app/dist ./build
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "serve -s build -l tcp://0.0.0.0:${PORT:-8080}"]
