# ---------- Build ----------
FROM golang:1.23-alpine AS build
WORKDIR /app
RUN apk add --no-cache build-base ca-certificates
ENV CGO_ENABLED=1
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN go build -ldflags="-s -w" -o server ./main.go

# ---------- Runtime ----------
FROM alpine:3.20
WORKDIR /app
RUN adduser -D -u 10001 app && apk add --no-cache ca-certificates tzdata
COPY --from=build /app/server /app/server

# คัดลอกไฟล์ที่แอปใช้งาน (CSV/static/seed DB ถ้ามี)
COPY backend/config   /app/config
COPY backend/public   /app/public
# (ถ้าต้อง seed DB)
# COPY Backend/co-op-match.db /app/data/app.db
RUN mkdir -p /app/data /app/public/uploads && chown -R app:app /app
USER app

ENV PORT=8080 \
    GIN_MODE=release \
    DB_DIALECT=sqlite \
    DB_PATH=/app/data/app.db \
    DATA_DIR=/app/config \
    UPLOAD_DIR=/app/public/uploads

EXPOSE 8080
CMD ["/app/server"]
