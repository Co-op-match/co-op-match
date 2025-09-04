// ปกติใช้ในทุกเพจ
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").toString().replace(/\/$/, "");

export const ASSET_BASE =
  (import.meta.env.VITE_ASSET_BASE_URL ?? API_BASE).toString().replace(/\/$/, "");

// ต่อ URL รูป/ไฟล์ให้เป็น absolute (รับได้ทั้ง "/uploads/a.png" หรือ "http://.../a.png")
export function fileURL(p?: string | null): string | undefined {
  if (!p) return undefined;
  const s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${ASSET_BASE}${s.startsWith("/") ? "" : "/"}${s}`;
}
