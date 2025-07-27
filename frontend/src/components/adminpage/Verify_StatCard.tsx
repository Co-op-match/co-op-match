import { Row, Col, Card } from "antd";
import React from "react";

interface StatCardProps {
  statusCounts: Record<string, number>;
  totalActive: number;
  totalDeleted: number;
  tabKey: string;
}

const Verify_StatCard: React.FC<StatCardProps> = ({
  statusCounts,
  totalActive,
  totalDeleted,
  tabKey,
}) => {
  // สีเดียวกันสำหรับทุกสถานะ
  const sharedStatusColor = {
    bg: "linear-gradient(135deg, #d2f3ffff 0%, #9fd1fcff 100%)",
    shadow: "rgba(79, 172, 254, 0.3)",
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
                border: "none",
                borderRadius: "16px",
                boxShadow: `0 8px 32px ${sharedStatusColor.shadow}`,
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              styles={{ body: { padding: "20px", textAlign: "center" } }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 40px ${sharedStatusColor.shadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 8px 32px ${sharedStatusColor.shadow}`;
              }}
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
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              border: "none",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(252, 182, 159, 0.3)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            styles={{ body: { padding: "20px", textAlign: "center" } }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(252, 182, 159, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(252, 182, 159, 0.3)";
            }}
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

export default Verify_StatCard;
