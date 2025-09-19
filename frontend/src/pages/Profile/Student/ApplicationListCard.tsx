import React, { useEffect, useState } from "react";
import { Table, Tag, Card } from "antd";
import { GetApplicationsByUserID } from "../../../services/https";
import type { IntershipPostInterface } from "../../../interfaces/IntershipPost";
import "./ApplicationListCard.css";

interface ApplicationItem {
  ID: number;
  Status: string;
  IntershipPost: IntershipPostInterface;
}

interface Props {
  userId?: number; // ✅ เพิ่ม prop
}

const ApplicationListCard: React.FC<Props> = ({ userId }) => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    GetApplicationsByUserID(userId)
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          console.error("Expected array but got:", data);
          setApplications([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching applications:", err);
        setApplications([]);
      });
  }, [userId]);

  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: "บริษัท",
      dataIndex: ["IntershipPost", "Company", "company_name"],
    },
    {
      title: "ตำแหน่งงาน",
      dataIndex: ["IntershipPost", "post_name"],
      render: (_: any, record: ApplicationItem) => (
        <a
          href={`/student/post-student/${record.IntershipPost?.ID}`}
          rel="noopener noreferrer"
        >
          {record.IntershipPost?.post_name}
        </a>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status", // ✅ ใช้ field ชื่อ Status ตาม interface
      render: (status: string | undefined) => {
        if (!status) return <Tag>รอดำเนินการ</Tag>;
        let color: "gold" | "red" | "green" | "default" = "default";
        if (status.includes("นัดสัมภาษณ์แล้ว")) color = "gold";
        else if (status.includes("ไม่ผ่าน")) color = "red";
        else if (status.includes("ผ่าน")) color = "green";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <Card className="application-list-card" title="รายการที่สมัครไปทั้งหมด">
      <Table
        columns={columns}
        dataSource={applications}
        rowKey={(record) => record?.ID ?? record?.IntershipPost?.ID ?? Math.random()}
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default ApplicationListCard;
