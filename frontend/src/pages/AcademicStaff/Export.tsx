import React, { useMemo } from "react";
import { Button, Tooltip } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

/* ================= Props ================= */
interface ExportProps {
  students?: any[];
  companiesCoop?: Array<{
    key: string;
    company_name: string;
    applicants_count: number;
    last_apply_at?: string;
  }>;
  apps?: any[];
  dailyRows?: Array<{
    day: string; total: number; pass: number; review: number;
    interviewed: number; waiting: number; fail_combined: number;
  }>;
  fileName?: string;
}

/* =============== Constants =============== */
const HEADER_FONT = { bold: true, color: { argb: "FF1D4ED8" } }; // ตัวอักษรหัวตารางสีฟ้าเข้ม

/* =============== Helpers ================= */
const pad = (v: any) => {
  const s = v == null ? "" : String(v).trim();
  return s ? s : "-";
};

function thDatetime(v?: string | Date): string {
  if (!v) return "-";
  const d = dayjs(v);
  if (!d.isValid()) return "-";
  const buddhistYear = d.year() + 543; // พ.ศ.
  return `${d.format("D MMM")} ${buddhistYear} ${d.format("HH:mm")}`;
}

/** ใส่กรอบ/หัวตาราง/Freeze/Filter/AutoFit เฉพาะช่วงคอลัมน์จริง
 *  และ "ไม่วาดเส้นคั่น **แนวนอน** ภายในบล็อกที่ merge แนวนอน"
 *  (รองรับแนวตั้งด้วยเผื่อใช้ในอนาคต)
 */
type MergeBlock = { r1: number; c1: number; r2: number; c2: number };

function styleTable(
  ws: ExcelJS.Worksheet,
  headerRow = 1,
  startCol = 1,
  endCol?: number,
  verticalBlocks: MergeBlock[] = [],   // merge ข้ามหลายแถว (แนวตั้ง)
  horizontalBlocks: MergeBlock[] = []  // merge ข้ามหลายคอลัมน์ (แนวนอน)
) {
  const bottomRow = ws.lastRow?.number ?? headerRow;
  const headerCellCount = ws.getRow(headerRow).cellCount || startCol;
  const rightCol = endCol ?? headerCellCount;

  for (let r = headerRow; r <= bottomRow; r++) {
    if (r === headerRow) ws.getRow(r).height = 20;

    for (let c = startCol; c <= rightCol; c++) {
      // เริ่มด้วยเส้นดำทุกด้าน
      let top: ExcelJS.Borders["top"] | undefined = { style: "thin", color: { argb: "FF000000" } };
      let bottom: ExcelJS.Borders["bottom"] | undefined = { style: "thin", color: { argb: "FF000000" } };
      let left: ExcelJS.Borders["left"] | undefined = { style: "thin", color: { argb: "FF000000" } };
      let right: ExcelJS.Borders["right"] | undefined = { style: "thin", color: { argb: "FF000000" } };

      // ถ้าอยู่ในบล็อก merge แนวตั้ง → ไม่วาดเส้นคั่น "แนวนอน" ภายในบล็อก
      for (const b of verticalBlocks) {
        const inCols = c >= b.c1 && c <= b.c2;
        const inRows = r >= b.r1 && r <= b.r2;
        if (inCols && inRows) {
          if (r > b.r1) top = undefined;
          if (r < b.r2) bottom = undefined;
        }
      }

      // ถ้าอยู่ในบล็อก merge แนวนอน → ไม่วาดเส้นคั่น "แนวตั้ง" ภายในบล็อก
      for (const hb of horizontalBlocks) {
        const inCols = c >= hb.c1 && c <= hb.c2;
        const inRows = r >= hb.r1 && r <= hb.r2;
        if (inCols && inRows) {
          if (c > hb.c1) left = undefined;
          if (c < hb.c2) right = undefined;
        }
      }

      const cell = ws.getCell(r, c);
      cell.border = { top, left, bottom, right };
      cell.alignment = cell.alignment || { vertical: "middle" };
    }
  }

  // header font + center
  const header = ws.getRow(headerRow);
  header.font = HEADER_FONT;
  for (let c = startCol; c <= rightCol; c++) {
    ws.getCell(headerRow, c).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }

  // Freeze
  ws.views = [{ state: "frozen", ySplit: headerRow }];

  // AutoFit (สูงสุด 60)
  for (let c = startCol; c <= rightCol; c++) {
    let max = 10;
    for (let r = headerRow; r <= bottomRow; r++) {
      const text = String(ws.getCell(r, c).value ?? "");
      max = Math.max(max, text.length + 2);
    }
    ws.getColumn(c).width = Math.min(Math.max(max, 10), 60);
  }

  // AutoFilter
  ws.autoFilter = {
    from: { row: headerRow, column: startCol },
    to:   { row: headerRow, column: rightCol },
  };
}

/* ===== build student lookup (เอาข้อมูลสาขา/คณะจาก students) ===== */
function buildStudentLookup(students: any[]) {
  const byId = new Map<string | number, any>();
  const byName = new Map<string, any>();
  for (const s of students || []) {
    const idKey = s?.id ?? s?.ID;
    if (idKey != null) byId.set(idKey, s);
    const composedName = [s?.first_name ?? s?.FirstName, s?.last_name ?? s?.LastName]
      .filter(Boolean)
      .join(" ");
    const nameKey = s?.full_name ?? (composedName || undefined);
    if (nameKey) byName.set(String(nameKey), s);
  }
  return { byId, byName };
}

/* ========= Aggregations ========= */
// รวมตามนักศึกษา (เก็บทั้ง created/updated ต่อรายการ)
function groupByStudent(apps: any[], students: any[]) {
  type Row = { company_name: string; post_name: string; status: string; created_at: string; updated_at: string };
  type Group = { student_name: string; program_name?: string; faculty_name?: string; rows: Row[] };

  const { byId, byName } = buildStudentLookup(students);
  const map = new Map<string, Group>();

  for (const a of apps || []) {
    const composed = [a.student_first_name, a.student_last_name].filter(Boolean).join(" ");
    const displayName = a.student_full_name ?? (composed || undefined);
    const keyId = a.student_id;
    const key = String(keyId ?? displayName ?? "-");

    const profile =
      (keyId != null ? byId.get(keyId) : undefined) ??
      (displayName ? byName.get(String(displayName)) : undefined);

    if (!map.has(key)) {
      map.set(key, {
        student_name: pad(displayName),
        program_name: pad(
          profile?.program_name ??
          profile?.program ??
          profile?.major ??
          profile?.Program?.name ??
          profile?.ProgramName
        ),
        faculty_name: pad(
          profile?.faculty_name ??
          profile?.faculty ??
          profile?.Faculty?.name ??
          profile?.FacultyName
        ),
        rows: [],
      });
    }

    const created = a.created_at ?? a.submit_at; // วันที่สมัคร
    const updated = a.updated_at;                 // วันที่อัปเดต (อาจว่าง)

    map.get(key)!.rows.push({
      company_name: pad(a.company_name ?? a.company),
      post_name: pad(a.post_name ?? a.position),
      status: pad(a.status),
      created_at: thDatetime(created),
      updated_at: thDatetime(updated),
    });
  }

  return Array.from(map.values()).sort((a, b) => b.rows.length - a.rows.length);
}

// รวมตามบริษัท (เก็บทั้ง created/updated ของแต่ละแถว + latest = max(updated, created))
function groupByCompany(apps: any[]) {
  type Row = { student: string; post_name: string; status: string; created_at: string; updated_at: string };
  type Group = { company_name: string; total: number; latest?: string; rows: Row[] };

  const map = new Map<string, Group>();

  for (const a of apps || []) {
    const cname = pad(a.company_name ?? a.company);
    if (!map.has(cname)) map.set(cname, { company_name: cname, total: 0, latest: undefined, rows: [] });
    const g = map.get(cname)!;

    const composed = [a.student_first_name, a.student_last_name].filter(Boolean).join(" ");
    const studentName = a.student_full_name ?? (composed || undefined);
    const created = a.created_at ?? a.submit_at;
    const updated = a.updated_at;

    g.rows.push({
      student: pad(studentName),
      post_name: pad(a.post_name ?? a.position),
      status: pad(a.status),
      created_at: thDatetime(created),
      updated_at: thDatetime(updated),
    });

    g.total += 1;

    const latestDate = (updated && dayjs(updated).isValid() ? updated : created) ?? created;
    if (latestDate && (!g.latest || new Date(latestDate) > new Date(g.latest))) g.latest = latestDate;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/* ============== Workbook Builder ============== */
async function buildWorkbook({
  students = [],
  companiesCoop = [],
  apps = [],
  dailyRows = [],
  fileName = `รายงาน_อาจารย์_${dayjs().format("YYYYMMDD_HHmm")}`,
}: Required<ExportProps>) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CoopMatch";
  wb.created = new Date();

  /* ----- Summary ----- */
  {
    const ws = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FF1677FF" } } });
    // title (merge แนวนอน)
    ws.addRow([`สรุปรายงานแดชบอร์ดอาจารย์ (Export ${dayjs().format("YYYY-MM-DD HH:mm")})`]);
    ws.mergeCells(1, 1, 1, 4);
    const title = ws.getCell(1, 1);
    title.font = { bold: true, size: 14, color: { argb: "FF1D4ED8" } };
    title.alignment = { horizontal: "left", vertical: "middle" };

    ws.addRow([]);
    ws.addRow(["รายการ", "ค่า"]);
    ws.addRow(["จำนวนนักศึกษาทั้งหมด", students.length]);
    ws.addRow(["จำนวนบริษัท (มีผู้สมัคร)", companiesCoop.length]);
    ws.addRow(["จำนวนใบสมัครทั้งหมด", apps.length]);

    // ตารางจริงเริ่ม headerRow=3, ใช้คอลัมน์ 1..2
    styleTable(ws, 3, 1, 2);
  }

  /* ----- Students ----- */
  {
    const ws = wb.addWorksheet("Students", { properties: { tabColor: { argb: "FF22C55E" } } });
    ws.addRow(["ลำดับ", "รหัส", "ชื่อ-นามสกุล", "อีเมล", "สาขา", "คณะ", "มหาวิทยาลัย", "เบอร์โทร"]);

    (students || []).forEach((s: any, idx: number) => {
      const composedName = [s?.first_name ?? s?.FirstName, s?.last_name ?? s?.LastName].filter(Boolean).join(" ");
      const fullName = s?.full_name ?? (composedName || undefined);

      ws.addRow([
        idx + 1,
        pad(s?.id ?? s?.ID),
        pad(fullName),
        pad(s?.email ?? s?.Email),
        pad(s?.program_name ?? s?.program ?? s?.major ?? s?.Program?.name ?? s?.ProgramName),
        pad(s?.faculty_name ?? s?.faculty ?? s?.Faculty?.name ?? s?.FacultyName),
        pad(s?.university_name ?? s?.university ?? s?.University?.name),
        pad(s?.phone_number ?? s?.phone),
      ]);
    });

    styleTable(ws, 1, 1, 8);
  }

  /* ----- Companies ----- */
  {
    const ws = wb.addWorksheet("Companies", { properties: { tabColor: { argb: "FFF59E0B" } } });
    ws.addRow(["ลำดับ", "บริษัท", "จำนวนผู้สมัคร", "อัปเดตล่าสุด"]);
    (companiesCoop || []).forEach((c, idx) => {
      ws.addRow([
        idx + 1,
        pad(c.company_name),
        Number(c.applicants_count || 0),
        c.last_apply_at ? dayjs(c.last_apply_at).format("YYYY-MM-DD HH:mm") : "-",
      ]);
    });
    ws.getColumn(3).alignment = { horizontal: "right" };

    styleTable(ws, 1, 1, 4);
  }

  /* ----- Applications (ทั้งหมด) ----- */
  {
    const ws = wb.addWorksheet("Applications (ทั้งหมด)", { properties: { tabColor: { argb: "FF6366F1" } } });
    ws.addRow(["ลำดับ", "ชื่อนักศึกษา", "บริษัท", "ตำแหน่ง", "สถานะ", "วันที่สมัคร", "วันที่อัปเดต"]);

    (apps || []).forEach((a: any, idx: number) => {
      const composed = [a.student_first_name, a.student_last_name].filter(Boolean).join(" ");
      const studentName = a.student_full_name ?? (composed || undefined);
      const created = a.created_at ?? a.submit_at;
      const updated = a.updated_at;
      ws.addRow([
        idx + 1,
        pad(studentName),
        pad(a.company_name ?? a.company),
        pad(a.post_name ?? a.position),
        pad(a.status),
        thDatetime(created),
        thDatetime(updated),
      ]);
    });

    ws.getColumn(1).alignment = { horizontal: "right" };
    styleTable(ws, 1, 1, 7);
  }

  /* ----- Applications_รวมนักศึกษา (merge แนวตั้งบางคอลัมน์) ----- */
  {
    const ws = wb.addWorksheet("Applications_รวมนักศึกษา", { properties: { tabColor: { argb: "FF0EA5E9" } } });
    ws.addRow(["ลำดับ", "ชื่อ–สกุลนักศึกษา", "สาขา", "คณะ", "บริษัท", "ตำแหน่ง", "สถานะ", "วันที่สมัคร", "วันที่อัปเดต"]);

    const groups = groupByStudent(apps, students);
    let seq = 1;
    let currentRow = 2;
    const vBlocks: MergeBlock[] = []; // merge แนวตั้งสำหรับ 4 คอลัมน์แรก

    groups.forEach((g) => {
      const startRow = currentRow;
      g.rows.forEach((r, i) => {
        if (i === 0) {
          ws.addRow([seq, g.student_name, g.program_name, g.faculty_name, r.company_name, r.post_name, r.status, r.created_at, r.updated_at]);
        } else {
          ws.addRow(["", "", "", "", r.company_name, r.post_name, r.status, r.created_at, r.updated_at]);
        }
        currentRow++;
      });
      const endRow = currentRow - 1;

      if (endRow > startRow) {
        ws.mergeCells(startRow, 1, endRow, 1);
        ws.mergeCells(startRow, 2, endRow, 2);
        ws.mergeCells(startRow, 3, endRow, 3);
        ws.mergeCells(startRow, 4, endRow, 4);
        vBlocks.push({ r1: startRow, c1: 1, r2: endRow, c2: 4 });
      }
      seq++;
    });

    ws.getColumn(1).alignment = { horizontal: "right", vertical: "middle" };
    styleTable(ws, 1, 1, 9, vBlocks /* vertical */, [] /* horizontal */);
  }

  /* ----- Applications_รวมบริษัท (merge แนวตั้งบางคอลัมน์) ----- */
  {
    const ws = wb.addWorksheet("Applications_รวมบริษัท", { properties: { tabColor: { argb: "FF34D399" } } });
    ws.addRow(["ลำดับ", "ชื่อบริษัท", "จำนวนนักศึกษาที่สมัคร", "อัปเดตล่าสุด", "ชื่อนักศึกษา", "ตำแหน่ง", "สถานะ", "วันที่สมัคร", "วันที่อัปเดต"]);

    const groups = groupByCompany(apps);
    let seq = 1;
    let currentRow = 2;
    const vBlocks: MergeBlock[] = [];

    groups.forEach((g) => {
      const startRow = currentRow;
      g.rows.forEach((r, i) => {
        if (i === 0) {
          ws.addRow([seq, g.company_name, g.total, g.latest ? thDatetime(g.latest) : "-", r.student, r.post_name, r.status, r.created_at, r.updated_at]);
        } else {
          ws.addRow(["", "", "", "", r.student, r.post_name, r.status, r.created_at, r.updated_at]);
        }
        currentRow++;
      });
      const endRow = currentRow - 1;

      if (endRow > startRow) {
        ws.mergeCells(startRow, 1, endRow, 1);
        ws.mergeCells(startRow, 2, endRow, 2);
        ws.mergeCells(startRow, 3, endRow, 3);
        ws.mergeCells(startRow, 4, endRow, 4);
        vBlocks.push({ r1: startRow, c1: 1, r2: endRow, c2: 4 });
      }
      seq++;
    });

    ws.getColumn(1).alignment = { horizontal: "right", vertical: "middle" };
    ws.getColumn(3).alignment = { horizontal: "right", vertical: "middle" };
    styleTable(ws, 1, 1, 9, vBlocks, []);
  }

  /* ----- DailyTrend (ถ้ามี) ----- */
  if (dailyRows && dailyRows.length) {
    const ws = wb.addWorksheet("DailyTrend", { properties: { tabColor: { argb: "FF1D4ED8" } } });
    ws.addRow(["ลำดับ", "วันที่", "รวม", "ผ่าน", "กำลังพิจารณา", "นัดสัมภาษณ์แล้ว", "รอการนัดสัมภาษณ์", "ไม่ผ่าน/ไม่ได้รับเลือก"]);
    dailyRows
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .forEach((r, idx) => {
        ws.addRow([
          idx + 1,
          r.day,
          r.total ?? 0,
          r.pass ?? 0,
          r.review ?? 0,
          r.interviewed ?? 0,
          r.waiting ?? 0,
          r.fail_combined ?? 0,
        ]);
      });
    [3,4,5,6,7,8].forEach((col) => (ws.getColumn(col).alignment = { horizontal: "right" }));
    styleTable(ws, 1, 1, 8);
  }

  const buf = await wb.xlsx.writeBuffer({ useSharedStrings: true });
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${fileName}.xlsx`
  );
}

/* ============== Component ============== */
const AcademicExport: React.FC<ExportProps> = ({
  students = [],
  companiesCoop = [],
  apps = [],
  dailyRows = [],
  fileName,
}) => {
  const safeName = useMemo(
    () => fileName || `แดชบอร์ด_อาจารย์_${dayjs().format("YYYYMMDD_HHmm")}`,
    [fileName]
  );

  const handleExportAll = async () => {
    await buildWorkbook({ students, companiesCoop, apps, dailyRows, fileName: safeName });
  };

  // UI เหลือปุ่มเดียว
  return (
    <Tooltip
      title={`ส่งออก Excel: สรุป/นักศึกษา/บริษัท/ใบสมัคร${dailyRows?.length ? "/แนวโน้มรายวัน" : ""}
              รวม: นศ.${students.length} • บริษัท${companiesCoop.length} • ใบสมัคร${apps.length}${dailyRows?.length ? ` • วัน${dailyRows.length}` : ""}`}
    >      
      <Button className="action-button" type="primary" icon={<ExportOutlined />} size="large" onClick={handleExportAll}>
        ส่งออก Excel
      </Button>
    </Tooltip>
  );
};

export default AcademicExport;