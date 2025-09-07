// routeAfterAuth.ts
import { GetLatestVerificationByUserID } from "@/services/https";

export async function fetchVerifyStatus(userId: number): Promise<string | null> {
  try {
    const latest = await GetLatestVerificationByUserID(userId);
    return latest?.StatusVerify?.status_verify;
  } catch {
    return null;
  }
}

// 👇 อันนี้ไม่ async แล้ว คืน true/false ได้ทันทีจาก status ที่มีอยู่แล้ว
export function routeAfterAuth(roleId: number, status: string | null): boolean {
    if (!(roleId === 2 || roleId === 4)) return false; // company/lecturer เท่านั้น
    return status === "รอรับรอง" || status === "ปฏิเสธ";
}