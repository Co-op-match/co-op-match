import React, { useMemo } from "react";
import { Button, Dropdown } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import type { UserInterface } from "../../../interfaces/User";
import type { LoginLogInterface } from "../../../interfaces/LoginLog";

type Variant = "users" | "logs" | "both";

type Props = {
  variant: Variant;
  usersAll?: UserInterface[];
  usersFiltered?: UserInterface[];
  logsAll?: LoginLogInterface[];
  logsFiltered?: LoginLogInterface[];
};

const ts = () => dayjs().format("YYYYMMDD_HHmmss");
const excelName = (base: string) => `${base}_${ts()}.xlsx`;
const capSheet = (name: string) => (name.length > 31 ? name.slice(0, 31) : name);

const fitCols = (rows: any[]) =>
  !rows?.length
    ? []
    : Object.keys(rows[0]).map((k) => {
        const header = String(k).length;
        const maxCell = rows.reduce((m, r) => Math.max(m, String(r[k] ?? "").length), 0);
        return { wch: Math.min(Math.max(header, maxCell) + 2, 60) };
      });

const sheetFrom = (rows: any[], name: string) => {
  const safeRows = rows?.length ? rows : [{}]; // กันกรณีว่างให้ยังสร้างชีตได้
  const ws = XLSX.utils.json_to_sheet(safeRows);
  (ws as any)["!cols"] = fitCols(rows);
  return { ws, name: capSheet(name) };
};

const download = (sheets: { ws: XLSX.WorkSheet; name: string }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => XLSX.utils.book_append_sheet(wb, s.ws, s.name));
  XLSX.writeFile(wb, filename);
};

const fmtUsers = (rows: UserInterface[] = []) =>
  rows.map((u) => ({
    ID: u.ID,
    Email: u.Email,
    Role: u.Role?.RoleNameTH ?? "-",
    Active: u.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน",
    Online: u.is_logged_in ? "ออนไลน์" : "ออฟไลน์",
    CreatedAt: u.CreatedAt ? dayjs(u.CreatedAt).format("YYYY-MM-DD HH:mm:ss") : "",
    UpdatedAt: u.UpdatedAt ? dayjs(u.UpdatedAt).format("YYYY-MM-DD HH:mm:ss") : "",
  }));

const fmtLogs = (rows: LoginLogInterface[] = []) =>
  rows.map((l) => ({
    ID: l.ID,
    Email: l.User?.Email ?? "",
    LoginAt: l.login_at ? dayjs(l.login_at).format("YYYY-MM-DD HH:mm:ss") : "",
    LogoutAt: l.logout_at ? dayjs(l.logout_at).format("YYYY-MM-DD HH:mm:ss") : "",
  }));

const ExportExcelButton: React.FC<Props> = ({
  variant,
  usersAll = [],
  usersFiltered = [],
  logsAll = [],
  logsFiltered = [],
}) => {
  const counts = useMemo(
    () => ({
      ua: usersAll.length,
      uf: usersFiltered.length,
      la: logsAll.length,
      lf: logsFiltered.length,
    }),
    [usersAll, usersFiltered, logsAll, logsFiltered]
  );

  const exportUsers = (filtered: boolean) => {
    const rows = fmtUsers(filtered ? usersFiltered : usersAll);
    const { ws, name } = sheetFrom(rows, "Users");
    download([{ ws, name }], excelName(`users_${filtered ? "filtered" : "all"}`));
  };

  const exportLogs = (filtered: boolean) => {
    const rows = fmtLogs(filtered ? logsFiltered : logsAll);
    const { ws, name } = sheetFrom(rows, "LoginLogs");
    download([{ ws, name }], excelName(`login_logs_${filtered ? "filtered" : "all"}`));
  };

  const exportBoth = (filtered: boolean) => {
    const u = fmtUsers(filtered ? usersFiltered : usersAll);
    const l = fmtLogs(filtered ? logsFiltered : logsAll);
    const sheets = [sheetFrom(u, "Users"), sheetFrom(l, "LoginLogs")];
    download(sheets, excelName(`export_${filtered ? "filtered" : "all"}`));
  };

  const items =
    variant === "users"
      ? [
          { key: "u-f", label: `ผู้ใช้ (เฉพาะที่กรอง) • ${counts.uf}`, onClick: () => exportUsers(true), disabled: counts.uf === 0 },
          { key: "u-a", label: `ผู้ใช้ (ทั้งหมด) • ${counts.ua}`, onClick: () => exportUsers(false), disabled: counts.ua === 0 },
        ]
      : variant === "logs"
      ? [
          { key: "l-f", label: `บันทึกเข้าสู่ระบบ (เฉพาะที่กรอง) • ${counts.lf}`, onClick: () => exportLogs(true), disabled: counts.lf === 0 },
          { key: "l-a", label: `บันทึกเข้าสู่ระบบ (ทั้งหมด) • ${counts.la}`, onClick: () => exportLogs(false), disabled: counts.la === 0 },
        ]
      : [
          { key: "u-f", label: `ผู้ใช้ (เฉพาะที่กรอง) • ${counts.uf}`, onClick: () => exportUsers(true), disabled: counts.uf === 0 },
          { key: "u-a", label: `ผู้ใช้ (ทั้งหมด) • ${counts.ua}`, onClick: () => exportUsers(false), disabled: counts.ua === 0 },
          { type: "divider" as const },
          { key: "l-f", label: `บันทึกเข้าสู่ระบบ (เฉพาะที่กรอง) • ${counts.lf}`, onClick: () => exportLogs(true), disabled: counts.lf === 0 },
          { key: "l-a", label: `บันทึกเข้าสู่ระบบ (ทั้งหมด) • ${counts.la}`, onClick: () => exportLogs(false), disabled: counts.la === 0 },
          { type: "divider" as const },
          { key: "b-f", label: `ทั้งหมด (หลายชีต / เฉพาะที่กรอง)`, onClick: () => exportBoth(true), disabled: counts.uf + counts.lf === 0 },
          { key: "b-a", label: `ทั้งหมด (หลายชีต / ทั้งหมด)`, onClick: () => exportBoth(false), disabled: counts.ua + counts.la === 0 },
        ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>
        ส่งออกข้อมูล
      </Button>
    </Dropdown>
  );
};

export default ExportExcelButton;