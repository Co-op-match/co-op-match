// src/components/adminpage/ExportExcelButton.tsx
import React from "react";
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

const fitCols = (rows: any[]) => {
  if (!rows?.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((k) => {
    const header = String(k).length;
    const maxCell = rows.reduce((m, r) => Math.max(m, String(r[k] ?? "").length), 0);
    return { wch: Math.min(Math.max(header, maxCell) + 2, 60) };
  });
};

const sheetFrom = (rows: any[], name: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  (ws as any)["!cols"] = fitCols(rows);
  return { ws, name };
};

const download = (sheets: { ws: XLSX.WorkSheet; name: string }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => XLSX.utils.book_append_sheet(wb, s.ws, s.name));
  XLSX.writeFile(wb, filename);
};

const fmtUsers = (rows: UserInterface[]) =>
  (rows ?? []).map((u) => ({
    ID: u.ID,
    Email: u.Email,
    Role: u.Role?.RoleNameTH ?? "-",
    Active: u.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน",
    Online: u.is_logged_in ? "ออนไลน์" : "ออฟไลน์",
    CreatedAt: u.CreatedAt ? dayjs(u.CreatedAt).format("YYYY-MM-DD HH:mm:ss") : "",
    UpdatedAt: u.UpdatedAt ? dayjs(u.UpdatedAt).format("YYYY-MM-DD HH:mm:ss") : "",
  }));

const fmtLogs = (rows: LoginLogInterface[]) =>
  (rows ?? []).map((l) => ({
    ID: l.ID,
    Email: l.User?.Email ?? "",
    IP: l.ip ?? "",
    Device: l.device ?? "",
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
  const exportUsers = (filtered: boolean) => {
    const rows = fmtUsers(filtered ? usersFiltered : usersAll);
    const { ws, name } = sheetFrom(rows, "Users");
    download([{ ws, name }], `users_${filtered ? "filtered" : "all"}.xlsx`);
  };

  const exportLogs = (filtered: boolean) => {
    const rows = fmtLogs(filtered ? logsFiltered : logsAll);
    const { ws, name } = sheetFrom(rows, "LoginLogs");
    download([{ ws, name }], `login_logs_${filtered ? "filtered" : "all"}.xlsx`);
  };

  const exportBoth = (filtered: boolean) => {
    const sheets = [
      sheetFrom(fmtUsers(filtered ? usersFiltered : usersAll), "Users"),
      sheetFrom(fmtLogs(filtered ? logsFiltered : logsAll), "LoginLogs"),
    ];
    download(sheets, `export_${filtered ? "filtered" : "all"}.xlsx`);
  };

  const items =
    variant === "users"
      ? [
          { key: "u-f", label: "ผู้ใช้ (เฉพาะที่กรอง)", onClick: () => exportUsers(true) },
          { key: "u-a", label: "ผู้ใช้ (ทั้งหมด)", onClick: () => exportUsers(false) },
        ]
      : variant === "logs"
      ? [
          { key: "l-f", label: "บันทึกเข้าสู่ระบบ (เฉพาะที่กรอง)", onClick: () => exportLogs(true) },
          { key: "l-a", label: "บันทึกเข้าสู่ระบบ (ทั้งหมด)", onClick: () => exportLogs(false) },
        ]
      : [
          { key: "u-f", label: "ผู้ใช้ (เฉพาะที่กรอง)", onClick: () => exportUsers(true) },
          { key: "u-a", label: "ผู้ใช้ (ทั้งหมด)", onClick: () => exportUsers(false) },
          { type: "divider" as const },
          { key: "l-f", label: "บันทึกเข้าสู่ระบบ (เฉพาะที่กรอง)", onClick: () => exportLogs(true) },
          { key: "l-a", label: "บันทึกเข้าสู่ระบบ (ทั้งหมด)", onClick: () => exportLogs(false) },
          { type: "divider" as const },
          { key: "b-f", label: "ทั้งหมด (หลายชีต / เฉพาะที่กรอง)", onClick: () => exportBoth(true) },
          { key: "b-a", label: "ทั้งหมด (หลายชีต / ทั้งหมด)", onClick: () => exportBoth(false) },
        ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button icon={<DownloadOutlined />}>ส่งออกข้อมูล</Button>
    </Dropdown>
  );
};

export default ExportExcelButton;