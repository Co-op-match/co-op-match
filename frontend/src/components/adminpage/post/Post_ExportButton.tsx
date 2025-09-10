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
      <style>{enhancedButtonStyles}</style>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        disabled={!posts || posts.length === 0}
        className="enhanced-export-button"
        size="large"
      >
        ส่งออกข้อมูล
      </Button>
    </>
  );
};

export default ExportPostsButton;

// Enhanced styles for the button
const enhancedButtonStyles = `
  .enhanced-export-button {
    background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    padding: 8px 24px;
    height: auto;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    position: relative;
    overflow: hidden;
  }

  .enhanced-export-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  .enhanced-export-button:hover::before {
    left: 100%;
  }

  .enhanced-export-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    color: white;
  }

  .enhanced-export-button:active {
    transform: translateY(0);
  }

  .enhanced-export-button:disabled {
    background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
    box-shadow: none;
    transform: none;
    cursor: not-allowed;
  }

  .enhanced-export-button:disabled:hover {
    transform: none;
    box-shadow: none;
  }
`;