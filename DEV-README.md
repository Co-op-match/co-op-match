# Co-op Match Development Setup

## วิธีการรันระบบในโหมด Development (localhost)

### 1. เริ่ม Backend
```bash
cd backend

# Windows
dev-start.bat

# หรือ Linux/Mac
chmod +x dev-start.sh
./dev-start.sh

# หรือรันด้วย Go โดยตรง
go run main.go
```

### 2. เริ่ม Frontend
```bash
cd frontend

# รันใน development mode
npm run dev

# หรือรันแบบให้เข้าถึงจากเครื่องอื่นได้
npm run dev:local
```

### 3. เข้าใช้งาน
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **WebSocket**: ws://localhost:8080

## Environment Variables

### Frontend (.env.development)
```
VITE_API_BASE_URL=http://localhost:8080
VITE_ASSET_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws/notifications
VITE_API_BASE=http://localhost:8080
```

### Backend (.env.development)
```
CORS_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173
```

## หมายเหตุ
- Backend จะรันบน port 8080
- Frontend (Vite dev server) จะรันบน port 5173
- CORS ได้รับการตั้งค่าให้รองรับ localhost แล้ว
- WebSocket connections จะทำงานผ่าน ws:// protocol

## การแก้ไขปัญหา

### ถ้า CORS ยังมีปัญหา
1. ตรวจสอบว่า backend รันบน port 8080
2. ตรวจสอบว่า frontend รันบน port 5173
3. ลองรีสตาร์ททั้ง frontend และ backend

### ถ้า API ไม่ทำงาน
1. ตรวจสอบว่าไฟล์ .env.development ถูกโหลดหรือไม่
2. ตรวจสอบ console logs ใน browser
3. ตรวจสอบ backend logs
