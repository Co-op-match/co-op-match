// ปกติใช้ในทุกเพจ
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ?? "https://api.coop-match.online:8080").toString().replace(/\/$/, "");

export const ASSET_BASE =
  (import.meta.env.VITE_ASSET_BASE_URL ?? API_BASE).toString().replace(/\/$/, "");

// ต่อ URL รูป/ไฟล์ให้เป็น absolute (รับได้ทั้ง "/uploads/a.png" หรือ "http://.../a.png")
export function fileURL(p?: string | null): string | undefined {
  if (!p) return undefined;
  const s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${ASSET_BASE}${s.startsWith("/") ? "" : "/"}${s}`;
}

// ✅ ฟังก์ชันดึงนามสกุลไฟล์จาก URL (กันทั้ง query/hash และ relative path)
export const getExtension = (u?: string): string => {
  if (!u) return "";
  try {
    const abs = fileURL(u) as string; // แปลงให้เป็น absolute ก่อน
    const urlObj = new URL(abs);
    const pathname = urlObj.pathname.toLowerCase();
    const dot = pathname.lastIndexOf(".");
    return dot >= 0 ? pathname.slice(dot + 1) : "";
  } catch {
    const s = String(u).toLowerCase().split("#")[0].split("?")[0];
    const dot = s.lastIndexOf(".");
    return dot >= 0 ? s.slice(dot + 1) : "";
  }
};