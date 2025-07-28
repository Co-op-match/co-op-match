import { Row, Col, Card } from "antd";
import React from "react";

interface StatCardProps {
  statusCounts: Record<string, number>;
  totalActive: number;
  totalDeleted: number;
  tabKey: string;
}

const User_StatCard: React.FC<StatCardProps> = ({
  statusCounts,
  totalActive,
  totalDeleted,
  tabKey,
}) => {
  // สีเดียวกันสำหรับทุกสถานะ
  /*   const sharedStatusColor = {
    bg: "linear-gradient(135deg, #d2f3ffff 0%, #9fd1fcff 100%)",
    shadow: "rgba(79, 172, 254, 0.3)",
  }; */
  const sharedStatusColor = {
    bg: "#e6f7ff", // พื้นหลังฟ้าอ่อน (Antd สี success light)
    border: "1px solid #91d5ff", // กรอบสีฟ้า
    shadow: "rgba(145, 213, 255, 0.4)", // เงาอ่อนๆ สีฟ้า
    text: "#000c17", // สีตัวอักษรเข้ม อ่านง่าย
  };

  return (
    <>
      {/* Stats Cards */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: "24px", justifyContent: "space-around" }}
      >
        {Object.entries(statusCounts).map(([status, count]) => (
          <Col xs={12} sm={12} md={12} lg={6} xl={4} key={status}>
            <Card
              style={{
                background: sharedStatusColor.bg,
                border: sharedStatusColor.border,
                borderRadius: "12px",
                boxShadow: `0 2px 12px ${sharedStatusColor.shadow}`,
                transition: "all 0.3s ease",
              }}
              styles={{ body: { padding: "20px", textAlign: "center" } }}
              /*               onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 4px 40px ${sharedStatusColor.shadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 32px ${sharedStatusColor.shadow}`;
              }} */
            >
              <div style={{ color: "#031662ff" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    opacity: 0.9,
                  }}
                >
                  {status}
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                  {count.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>
        ))}

        {/* Card เด่นสำหรับ "จำนวนบริษัททั้งหมด" */}
        <Col xs={12} sm={12} md={12} lg={6} xl={4}>
          <Card
            style={{
              background: "#fff1f0", // พื้นหลังชมพูอ่อน
              border: "1px solid #ffa39e", // กรอบสีชมพู
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(255, 163, 158, 0.25)", // เงาสีชมพูเบาๆ
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            styles={{ body: { padding: "20px", textAlign: "center" } }}
          >
            <div style={{ color: "#823c0aff" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px",
                }}
              >
                จำนวนบริษัททั้งหมด
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                {(tabKey === "active"
                  ? totalActive
                  : totalDeleted
                ).toLocaleString()}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default User_StatCard;
