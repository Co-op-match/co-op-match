import React from "react";
import { Row, Col, Card } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { StatusPostInterface } from "../../../interface/IStatusPost";

interface StatusCardProps {
  bgColor: string;
  border: string;
  color: string;
  icon: React.ReactNode;
  count: number;
  label: string;
}

interface Props {
  statusList: StatusPostInterface[];
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
}

const getStatusCardProps = (
  statusTh: string,
  counts: { total: number; pending: number; approved: number; rejected: number }
): StatusCardProps => {
  switch (statusTh) {
    case "เปิดรับสมัคร":
      return {
        bgColor: "#f6ffed",
        border: "1px solid #b7eb8f",
        color: "#389e0d",
        icon: (
          <CheckCircleOutlined style={{ fontSize: 24, color: "#389e0d" }} />
        ),
        count: counts.approved,
        label: "อนุมัติแล้ว",
      };
    case "ปิดรับสมัคร":
      return {
        bgColor: "#fff1f0",
        border: "1px solid #ffa39e",
        color: "#cf1322",
        icon: <CloseOutlined style={{ fontSize: 24, color: "#cf1322" }} />,
        count: counts.rejected,
        label: "ปฏิเสธแล้ว",
      };
    case "รอตรวจสอบ":
      return {
        bgColor: "#fffbe6",
        border: "1px solid #ffe58f",
        color: "#d48806",
        icon: (
          <ClockCircleOutlined style={{ fontSize: 24, color: "#d48806" }} />
        ),
        count: counts.pending,
        label: "รอตรวจสอบ",
      };
    default:
      return {
        bgColor: "#e6f7ff",
        border: "1px solid #91d5ff",
        color: "#1677ff",
        icon: <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />,
        count: counts.total,
        label: "โพสต์ทั้งหมด",
      };
  }
};

const showTotalCard = true; // หรือจะใช้ props แทนก็ได้

const Post_StatCard: React.FC<Props> = ({
  statusList,
  totalPosts,
  pendingPosts,
  approvedPosts,
  rejectedPosts,
}) => {
  const counts = {
    total: totalPosts,
    pending: pendingPosts,
    approved: approvedPosts,
    rejected: rejectedPosts,
  };
        console.log("statusList: ",statusList);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      {showTotalCard && (
        <Col xs={24} sm={12} md={6} key="ทั้งหมด">
          <Card
            style={{
              backgroundColor: "#e6f7ff",
              border: "1px solid #91d5ff",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1677ff",
                  }}
                >
                  {totalPosts}
                </div>
                <div style={{ fontSize: "14px", color: "#333" }}>
                  โพสต์ทั้งหมด
                </div>
              </div>
              <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            </div>
          </Card>
        </Col>
      )}

      {statusList?.map((status) => {
        const statusTh = status.status_post_th || "";
        const props = getStatusCardProps(statusTh, counts);

        return (
          <Col xs={24} sm={12} md={6} key={statusTh}>
            <Card
              style={{
                backgroundColor: props.bgColor,
                border: props.border,
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: props.color,
                    }}
                  >
                    {props.count}
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {props.label}
                  </div>
                </div>
                {props.icon}
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default Post_StatCard;
