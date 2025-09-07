# ---------- Build ----------
FROM golang:1.23-alpine AS build
WORKDIR /app
RUN apk add --no-cache build-base ca-certificates
ENV CGO_ENABLED=1
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -ldflags="-s -w" -o server ./main.go

# ---------- Runtime ----------
FROM alpine:3.20
WORKDIR /app
RUN adduser -D -u 10001 app && apk add --no-cache ca-certificates tzdata libstdc++
COPY --from=build /app/server /app/server

# ✅ คัดลอกไฟล์/โฟลเดอร์ที่แอปต้องใช้จริงตอนรัน
COPY config/            /app/config/
COPY public/            /app/public/
COPY utils/*.html       /app/utils/          
COPY logo/              /app/logo/          
# (ถ้ามีรูป seed เดิม)
# COPY uploads/         /app/public/uploads/

RUN mkdir -p /app/data /app/public/uploads && chown -R app:app /app
USER app

ENV PORT=8080 \
    GIN_MODE=release \
    DB_DIALECT=sqlite \
    DB_PATH=/app/data/app.db \
    DATA_DIR=/app/config \
    UPLOAD_DIR=/app/public/uploads \
    TEMPLATE_DIR=/app/utils           

EXPOSE 8080
CMD ["/app/server"]
