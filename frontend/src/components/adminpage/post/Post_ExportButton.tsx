// components/adminpage/post/ExportPostsButton.tsx
import React from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

type Row = Record<string, unknown>;

interface ExportProps { posts: IntershipPostInterface[]; }

// ---------- helpers (สั้น กระชับ อยู่แถวเดียวกันได้ให้อยู่แถวเดียวกัน) ----------
const pad = (n: number) => String(n).padStart(2, "0");
const nowStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};
const fmtTHDate = (dt?: string | Date) =>
  dt ? new Date(dt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-";
const fmtPlace = (p: IntershipPostInterface) =>
  [p.location_detail, p.subdistrict, p.district, p.province].filter(Boolean).join(", ");
const fmtGpa = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v).toFixed(2) : "-");

const textLen = (v: unknown) => {
  const s =
    v == null ? "" :
    Array.isArray(v) ? v.join(", ") :
    v instanceof Date ? v.toISOString() :
    typeof v === "object" ? JSON.stringify(v) :
    String(v);
  return s.split(/\r?\n/).reduce((m, line) => Math.max(m, [...line].length), 0); // รองรับยูนิโคด/อีโมจิ
};
const fitCols = (rows: Row[]) => {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  return headers.map((h) => {
    const head = [...h].length;
    const maxCell = rows.reduce((m, r) => Math.max(m, textLen(r[h])), 0);
    return { wch: Math.min(Math.max(head, maxCell) + 2, 60) };
  });
};

const sheetFrom = (rows: Row[], name: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  (ws as any)["!cols"] = fitCols(rows);
  if (ws["!ref"]) (ws as any)["!autofilter"] = { ref: ws["!ref"] }; // ใส่ AutoFilter อัตโนมัติ
  return { ws, name: name.slice(0, 31) }; // จำกัดชื่อชีต 31 ตัวอักษร
};

const download = (sheets: { ws: XLSX.WorkSheet; name: string }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => XLSX.utils.book_append_sheet(wb, s.ws, s.name));
  XLSX.writeFile(wb, filename.replace(/[\\/:*?"<>|]/g, "_"));
};
// ---------------------------------------------------------------------------------------

const ExportPostsButton: React.FC<ExportProps> = ({ posts }) => {
  const handleExport = () => {
    const rows: Row[] = (posts ?? []).map((post) => ({
      ชื่อตำแหน่ง: post.post_name ?? "-",
      บริษัท: post.Company?.company_name ?? "-",
      ประเภทงาน: post.JobType?.job_type ?? "-",
      จำนวนรับสมัคร: Number.isFinite(Number(post.quantity)) ? Number(post.quantity) : "-",
      เกรดขั้นต่ำ: fmtGpa(post.min_gpa),
      สถานที่: fmtPlace(post),
      ผู้สมัคร: post.Applications?.length ?? 0,
      สถานะ: post.StatusPost?.status_post_th ?? "-",
      วันที่สร้าง: fmtTHDate(post.CreatedAt),
    }));

    const { ws, name } = sheetFrom(rows.length ? rows : [{}], "โพสต์ฝึกงาน");
    download([{ ws, name }], `internship_posts_${nowStamp()}.xlsx`);
  };

  return (
    <>
      <style>{whitePillBtn}</style>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        disabled={!posts || posts.length === 0}
        className="white-pill-btn"
        size="large"
      >
        ส่งออกข้อมูล
      </Button>
    </>
  );
};

export default ExportPostsButton;

const whitePillBtn = `
  .white-pill-btn {
    background: #fff;
    color: #1e3a8a;                 /* น้ำเงินเข้ากับเฮดเดอร์ */
    border: 2px solid rgba(255,255,255,.7);
    border-radius: 16px;
    height: 48px;
    padding: 0 28px;
    font-weight: 800;
    box-shadow: 0 6px 18px rgba(30,58,138,.18);
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease, color .2s ease;
  }
  .white-pill-btn .anticon {
    font-size: 18px;
    margin-right: 10px;
    color: #1e3a8a;                 /* ไอคอนสีน้ำเงิน */
    transform: translateY(1px);     /* จูน baseline ให้ตรงข้อความ */
  }
  .white-pill-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 26px rgba(30,58,138,.26);
    border-color: rgba(255,255,255,.9);
    color: #1e3a8a;
  }
  .white-pill-btn:active { transform: translateY(0); }

  .white-pill-btn:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    border-color: #e2e8f0;
    box-shadow: none;
  }
  @media (max-width: 576px) {
    .white-pill-btn { height: 44px; padding: 0 22px; }
  }
`;
