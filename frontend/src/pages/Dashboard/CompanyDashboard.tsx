import { useEffect, useState } from "react";
import { Row, Col, Typography, Space, ConfigProvider, message, Layout, Badge } from "antd";
import { CalendarOutlined, DashboardOutlined, BuildOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { OverviewInterface, PipelineBucketInterface, TopPostItem } from "../../interfaces/Analysis";
import { GetCompanyByUserID } from "../../services/https/Application";
import { GetPostByCompanyId } from "../../services/https/post";
import { getOverview, getPipeline } from "../../services/https";
import Overview from "../company/analysis/Overview";
import TrendChart from "../company/analysis/TrendChart";
import PipelineFunnel from "../company/analysis/PipelineFunnel";
import type { CompanyInterface } from "../../interfaces/Company";
import CompanyHeader from "../Component/CompanyHeader";
import TopPostsCard from "../company/analysis/TopPostsCard";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);

const { Text, Title } = Typography;

// -------------------- Utils --------------------
/* function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) =>
        headers
          .map((h) => {
            const cell = (r as any)[h];
            if (cell === null || cell === undefined) return "";
            const s = typeof cell === "string" ? cell : JSON.stringify(cell);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
} */

// -------------------- Component --------------------
const CompanyDashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);

  // data states
  const [overview, setOverview] = useState<OverviewInterface | null>(null);
  const [funnelData, setFunnelData] = useState<PipelineBucketInterface[]>([]);
  const [company, setCompany] = useState<CompanyInterface>();

  // สรุปสถานะโพสต์ (นับจากรายการโพสต์จริงของบริษัท)
  const [postStatusCounts, setPostStatusCounts] = useState({
    open: 0,
    closed: 0,
    pending: 0,
  });

  const navigate = useNavigate();
  const topPosts: TopPostItem[] =
    overview?.topPosts ??
    (overview?.topPost
      ? [
          {
            postId: overview.topPost.postId,
            postName: overview.topPost.postName,
            applications: overview.topPost.applications,
          },
        ]
      : []);

  // โหลดนับสถานะโพสต์ (อิงจากโพสต์จริง)
  useEffect(() => {
    if (!company?.ID) return;
    (async () => {
      try {
        const res = await GetPostByCompanyId(Number(company?.ID));
        if (res?.status === 200 && Array.isArray(res.data)) {
          const open = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Open"
          ).length;
          const closed = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Closed"
          ).length;
          const pending = res.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Pending Approval"
          ).length;
          setPostStatusCounts({ open, closed, pending });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [company?.ID]);

  // โหลดข้อมูล analysis ทั้งชุด
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) หา companyId จาก user ปัจจุบัน
        const userId = Number(localStorage.getItem("id"));
        if (!userId) {
          messageApi.error("ไม่พบ user id ใน localStorage");
          return;
        }
        const compRes = await GetCompanyByUserID(userId);

        if (!compRes) {
          messageApi.error("ดึงข้อมูลบริษัทไม่สำเร็จ");
          return;
        }
        setCompany(compRes);

        // 3) ยิงทุก analytics พร้อมกัน + ดึงโพสต์เพื่อนับสถานะ
        const [overview, pipeline, postByCompanyId] =
          await Promise.all([
            getOverview(compRes.ID),
            getPipeline(compRes.ID),
            GetPostByCompanyId(compRes.ID),
          ]);

        // 4) เซ็ต state
        setOverview(overview ?? null);
        setFunnelData(Array.isArray(pipeline) ? pipeline : []);

        if (
          postByCompanyId?.status === 200 &&
          Array.isArray(postByCompanyId.data)
        ) {
          const open = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Open"
          ).length;
          const closed = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Closed"
          ).length;
          const pending = postByCompanyId.data.filter(
            (p: any) => p?.StatusPost?.status_post === "Pending Approval"
          ).length;
          setPostStatusCounts({ open, closed, pending });
        }
      } catch (err) {
        console.error(err);
        messageApi.error("โหลดข้อมูลวิเคราะห์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const customStyles = `
    .adminpage-layout {
      display: flex;
      flex-direction: column;
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 1) 0%,
        rgba(240, 248, 255, 1) 25%,
        rgba(207, 234, 250, 1) 60%,
        rgba(159, 218, 252, 1) 100%
      );
      position: relative;
    }

    .adminpage-layout::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(24, 144, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(135, 208, 104, 0.02) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(24, 144, 255, 0.02) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    .adminpage-layout > * {
      position: relative;
      z-index: 1;
    }

    .dashboard-header {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 20px;
      padding: 32px 40px;
      margin-bottom: 24px;
      box-shadow: 0 16px 48px rgba(24, 144, 255, 0.12);
      position: relative;
      overflow: hidden;
    }

    .dashboard-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1677ff 0%, #722ed1 50%, #52c41a 100%);
      border-radius: 20px 20px 0 0;
    }

    .dashboard-title {
      background: linear-gradient(135deg, #1677ff 0%, #722ed1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px !important;
      font-weight: 700;
      font-size: 2.5rem !important;
      line-height: 1.2;
    }

    .dashboard-subtitle {
      font-size: 18px !important;
      color: rgba(0, 0, 0, 0.65);
      margin-bottom: 16px !important;
      font-weight: 400;
    }

    .dashboard-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .dashboard-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(24, 144, 255, 0.05);
      border: 1px solid rgba(24, 144, 255, 0.1);
      border-radius: 8px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.75);
    }

    .dashboard-meta-item .anticon {
      color: #1677ff;
      font-size: 16px;
    }

    .chart-card {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(24, 144, 255, 0.1);
      height: 100%;
    }

    .chart-card .ant-card-head {
      background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-bottom: 1px solid rgba(24, 144, 255, 0.1);
    }

    .filter-card {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.85) !important;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 4px 20px rgba(24, 144, 255, 0.08);
    }

    .gradient-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%) !important;
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 12px 40px rgba(24, 144, 255, 0.12);
      height: 100%;
    }

    .kpi-card {
      backdrop-filter: blur(8px);
      background: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
      height: 100%;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(24, 144, 255, 0.15);
    }

    .kpi-card.info {
      background: linear-gradient(135deg, rgba(22, 119, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%) !important;
      border-color: rgba(22, 119, 255, 0.2);
    }

    .kpi-card.success {
      background: linear-gradient(135deg, rgba(82, 196, 26, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%) !important;
      border-color: rgba(82, 196, 26, 0.2);
    }

    .kpi-card.warning {
      background: linear-gradient(135deg, rgba(250, 173, 20, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%) !important;
      border-color: rgba(250, 173, 20, 0.2);
    }

    .kpi-card.danger {
      background: linear-gradient(135deg, rgba(255, 77, 79, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%) !important;
      border-color: rgba(255, 77, 79, 0.2);
    }

    .custom-tag {
      backdrop-filter: blur(4px);
      background: rgba(255, 255, 255, 0.8) !important;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 8px;
      font-weight: 500;
    }

    .section-title{
      background: linear-gradient(135deg, #1677ff 0%, #722ed1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px !important;
    }

    .section-title .section-title__icon,
    .section-title .anticon {
      background: none !important;
      -webkit-text-fill-color: initial !important;
      color: #1677ff;          
      vertical-align: -2px;
      margin-right: 8px;
    }

    .ant-table-thead > tr > th {
      background: rgba(240, 248, 255, 0.6) !important;
      backdrop-filter: blur(5px);
    }

    .ant-progress-inner {
      background: rgba(255, 255, 255, 0.6) !important;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        padding: 24px 20px;
      }
      
      .dashboard-title {
        font-size: 2rem !important;
      }
      
      .dashboard-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `;

  return (
    <Layout>
      <CompanyHeader />
      <div className="adminpage-layout">
        <style>{customStyles}</style>
        {contextHolder}
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1677ff",
              colorInfo: "#1677ff",
              colorLink: "#1677ff",
              colorSuccess: "#52c41a",
              colorWarning: "#faad14",
              colorError: "#ff4d4f",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)",
            },
            components: {
              Card: {
                borderRadiusLG: 16,
              },
              Button: {
                borderRadius: 8,
              },
              Tag: {
                borderRadius: 8,
              },
            },
          }}
        >
          <div style={{ padding: "0 8px" }}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {/* ENHANCED DASHBOARD HEADER */}
              <div className="dashboard-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <Title level={1} className="dashboard-title">
                      <DashboardOutlined
                        style={{ marginRight: 12, color: "#1677ff" }}
                      />
                      ภาพรวมบริษัท <span>{company?.company_name || "—"}</span>
                    </Title>
                    <Text className="dashboard-subtitle">
                      แดชบอร์ดสำหรับวิเคราะห์และติดตามผลการดำเนินงาน
                    </Text>

                    <div className="dashboard-meta">
                      <div className="dashboard-meta-item">
                        <CalendarOutlined />
                        <span>
                          อัปเดตล่าสุด: {dayjs().format("DD/MM/YYYY HH:mm")} น.
                        </span>
                      </div>
                      <div className="dashboard-meta-item">
                        <BuildOutlined />
                        <span>รหัสบริษัท: #{company?.ID || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <Badge
                      status={loading ? "processing" : "success"}
                      text={loading ? "กำลังโหลดข้อมูล..." : "ระบบพร้อมใช้งาน"}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    />
                  </div>
                </div>
              </div>

              {/* OVERVIEW + PIPELINE */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Overview
                    loading={loading}
                    overview={overview}
                    postStatusCounts={postStatusCounts}
                  />
                </Col>
                <Col xs={24} lg={8}>
                  <PipelineFunnel
                    loading={loading}
                    data={funnelData} // PipelineBucketInterface[] จาก getPipeline
                  />
                </Col>
              </Row>

              {/* POSTS PERFORMANCE + INTERVIEW STATS */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  {/* TREND DATA */}
                  <TrendChart companyId={Number(company?.ID)} />
                </Col>
                <Col xs={24} lg={8}>
                  <TopPostsCard
                    loading={loading}
                    topPosts={topPosts}
                    title="Top Posts (ยอดนิยม)"
                    onViewApplicants={(postId) =>
                      navigate(`/applications/post/${postId}`)
                    }
                    maxItems={5}
                  />
                </Col>
              </Row>
            </Space>
          </div>
        </ConfigProvider>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
