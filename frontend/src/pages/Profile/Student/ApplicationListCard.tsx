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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    setLoading(true);
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

type CompanyLite = { ID?: number; company_name?: string; user_id?: number };

const getCompanyProfileHref = (
  company?: CompanyLite,
  intership?: IntershipPostInterface
) => {
  // ✅ ปกติใช้ companyId
  const companyId = company?.ID ?? intership?.CompanyID;
  if (companyId) return `/company-profile/${companyId}`;

  // 🔁 เผื่อระบบคุณใช้ user_id ทำ route
  if (company?.user_id) return `/company/user/${company.user_id}`;

  return "#";
};

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
    render: (_: any, record: ApplicationItem) => {
      const company = record?.IntershipPost?.Company as CompanyLite | undefined;
      const name = company?.company_name ?? "-";
      const href = getCompanyProfileHref(company, record?.IntershipPost);
      return href !== "#" ? (
        <a href={href} rel="noopener noreferrer">{name}</a>
      ) : (
        <span>{name}</span>
      );
    },
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
    dataIndex: "status",
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
        loading={loading}
      />
    </Card>
  );
};

export default ApplicationListCard;
