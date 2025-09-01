import * as XLSX from "xlsx";

type Row = Record<string, any>;

const fitColumns = (rows: Row[]) => {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const colWidths = headers.map((h) => {
    const headerLen = String(h).length;
    const maxCell = rows.reduce((max, r) => {
      const v = r[h];
      const len = v == null ? 0 : String(v).length;
      return Math.max(max, len);
    }, 0);
    return { wch: Math.min(Math.max(headerLen, maxCell) + 2, 60) };
  });
  return colWidths;
};

export const sheetFromRows = (rows: Row[], sheetName: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  (ws as any)["!cols"] = fitColumns(rows);
  return { ws, sheetName };
};

export const downloadWorkbook = (sheets: { ws: XLSX.WorkSheet; sheetName: string }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ ws, sheetName }) => XLSX.utils.book_append_sheet(wb, ws, sheetName));
  XLSX.writeFile(wb, filename);
};
