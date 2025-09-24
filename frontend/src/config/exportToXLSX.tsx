import * as XLSX from "xlsx";

/** สร้างไฟล์ .xlsx ที่มีหลายชีต */
export function exportToXLSX(
  sheets: { name: string; rows: Record<string, any>[] }[],
  filename: string
) {
  const wb = XLSX.utils.book_new();

  for (const s of sheets) {
    // แปลง rows (array of objects) -> worksheet
    const ws = XLSX.utils.json_to_sheet(s.rows, { skipHeader: false });

    // (ออปชัน) กำหนดความกว้างคอลัมน์แบบคร่าว ๆ
    const headers = Object.keys(s.rows?.[0] ?? {});
    ws["!cols"] = headers.map(h => ({ wch: Math.max(10, String(h).length + 2) }));

    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31)); // limit 31 char
  }

  XLSX.writeFile(wb, `${filename}.xlsx`, { compression: true });
}