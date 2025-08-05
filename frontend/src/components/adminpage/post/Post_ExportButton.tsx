// components/adminpage/post/ExportPostsButton.tsx
import React from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";

interface ExportProps {
  posts: IntershipPostInterface[];
}

const ExportPostsButton: React.FC<ExportProps> = ({ posts }) => {
  const handleExport = () => {
    const exportData = posts.map((post) => ({
      "ชื่อตำแหน่ง": post.post_name,
      "บริษัท": post.Company?.company_name ?? "-",
      "ประเภทงาน": post.JobType?.job_type ?? "-",
      "จำนวนรับสมัคร": post.quantity ?? "-",
      "เกรดขั้นต่ำ": (Number(post.min_gpa) || 0).toFixed(2) ?? "-",
      "สถานที่": [
        post.location_detail,
        post.subdistrict,
        post.district,
        post.province,
      ]
        .filter(Boolean)
        .join(", "),
      "ผู้สมัคร": post.Applications?.length ?? 0,
      "สถานะ": post.StatusPost?.status_post_th ?? "-",
      "วันที่สร้าง": new Date(post.CreatedAt).toLocaleDateString("th-TH"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "โพสต์ฝึกงาน");

    XLSX.writeFile(workbook, "internship_posts_export.xlsx");
  };

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleExport}
      style={{
        backgroundColor: "#e6f4ff",
        border: "1px solid #91caff",
        color: "#1677ff",
        borderRadius: "8px",
      }}
    >
      ส่งออกข้อมูล
    </Button>
  );
};

export default ExportPostsButton;