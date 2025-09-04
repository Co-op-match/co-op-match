# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# เลือกใช้ตัวที่คุณใช้จริง (npm/pnpm/yarn)
RUN npm ci

# ส่งค่า API base เข้า build ได้ (Vite: import.meta.env.VITE_API_URL)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./build
ENV PORT=8080
EXPOSE 8080
CMD ["serve", "-s", "build", "-l", "8080"]
