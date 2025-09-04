# ---------- Build stage ----------
FROM golang:1.23.6-bookworm AS builder  
WORKDIR /app

# go-sqlite3 ต้องใช้ CGO + gcc ตอน build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates && rm -rf /var/lib/apt/lists/*

ENV CGO_ENABLED=1 GOOS=linux

COPY go.mod go.sum ./
RUN go mod download

# คัดลอกซอร์สทั้งหมด (ตามโครงสร้างที่คุณมี: main.go อยู่ราก backend)
COPY . .

# สร้างไบนารี
RUN go build -ldflags="-s -w" -o server ./main.go

# ---------- Runtime stage ----------
FROM debian:bookworm-slim
WORKDIR /app

# สร้าง user/โฟลเดอร์สำหรับ DB และ static (uploads)
RUN useradd -m app && mkdir -p /app/data /app/public && chown -R app:app /app

# ไบนารี
COPY --from=builder /app/server /app/server

# ✅ ใช้ไฟล์ DB จริงของคุณเป็น seed (DEV/DEMO เท่านั้น)
# ถ้าไม่ต้องการ seed ให้คอมเมนต์บรรทัดนี้ทิ้ง และปล่อยให้ SQLite สร้างไฟล์เอง
COPY co-op-match.db /app/data/app.db

# (ออปชัน) คัดลอกไฟล์ static เดิม (ถ้าแอปเสิร์ฟจาก ./public)
COPY public/ /app/public/

USER app

# ตั้งค่าแอป
ENV PORT=8080 \
    GIN_MODE=release \
    DB_DIALECT=sqlite \
    DB_PATH=/app/data/app.db \
    UPLOAD_DIR=/app/public/uploads

EXPOSE 8080
CMD ["/app/server"]
