// src/pages/student/ApplicationDetailsList.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Space,
  Typography,
  Button,
  Empty,
  Skeleton,
  Modal,
  Image,
  message,
  Tooltip,
  Segmented,
  Input,
} from "antd";
import {
  FileSearchOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import th from "dayjs/locale/th";
import { toFileURL } from "../../services/https/index";
import type { ApplicationInterface } from "../../interface/IApplication";
import { GetApplicationsByStudentID } from "../../services/https/Application";

dayjs.locale(th);
const { Title, Text } = Typography;

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    กำลังพิจารณา: "blue",
    รอการนัดสัมภาษณ์: "orange",
    นัดสัมภาษณ์แล้ว: "purple",
    ผ่าน: "green",
    ไม่ผ่าน: "red",
    ไม่ได้รับเลือก: "red",
  };
  return map[s] ?? "default";
};

type PreviewState =
  | { open: false }
  | { open: true; title: string; src: string };

// ให้ผลเป็น [] เสมอ ไม่ว่า API จะส่ง [], {items:[]}, {data:[]}, หรือ null/undefined
const asArray = <T,>(v: any): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (Array.isArray(v?.items)) return v.items as T[];
  if (Array.isArray(v?.data)) return v.data as T[];
  return [];
};

const ApplicationDetailsList: React.FC<{ studentId?: number }> = ({
  studentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ApplicationInterface[]>([]);
  const [preview, setPreview] = useState<PreviewState>({ open: false });
  const [seg, setSeg] = useState<
    | "ทั้งหมด"
    | "กำลังพิจารณา"
    | "รอการนัดสัมภาษณ์"
    | "นัดสัมภาษณ์แล้ว"
    | "ผ่าน"
    | "ไม่ผ่าน"
  >("ทั้งหมด");
  const [q, setQ] = useState("");

  const id =
    studentId ??
    Number(
      localStorage.getItem("student_id") ||
        localStorage.getItem("studentId") ||
        0
    );

  const fetchData = async () => {
    if (!id) {
      message.error("ไม่พบรหัสนักศึกษา");
      return;
    }
    setLoading(true);
    try {
      const data = await GetApplicationsByStudentID(id);
      setItems(data);
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลใบสมัครไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const itemsArray = useMemo(
    () => asArray<ApplicationInterface>(items),
    [items]
  );

  const filtered = useMemo(() => {
    let list = itemsArray;

    if (seg !== "ทั้งหมด") list = list.filter((x) => x.status === seg);

    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.company_name?.toLowerCase().includes(k) ||
          x.position?.toLowerCase().includes(k)
      );
    }

    return [...list].sort((a, b) => {
      const da = a?.date ? dayjs(a.date).valueOf() : 0;
      const db = b?.date ? dayjs(b.date).valueOf() : 0;
      return db - da;
    });
  }, [itemsArray, seg, q]);

  const totalByStatus = useMemo(() => {
    const map = new Map<string, number>();
    itemsArray.forEach((x) => map.set(x.status, (map.get(x.status) ?? 0) + 1));
    return map;
  }, [itemsArray]);

  const openPreview = (title: string, src?: string) => {
    if (!src) return;
    setPreview({ open: true, title, src: toFileURL(src) });
  };

  const downloadFile = (src?: string) => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = toFileURL(src);
    a.download = "";
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="app-details-wrap">
      <div className="header">
        <div>
          <Title level={3} style={{ margin: 0, color: "#0B2545" }}>
            🗂️ รายละเอียดใบสมัครของนักศึกษา
          </Title>
          <Text type="secondary">
            ดูสถานะและไฟล์แนบ (Resume/Transcript) ของแต่ละใบสมัคร
          </Text>
        </div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="ค้นหา บริษัท/ตำแหน่ง..."
            onSearch={setQ}
            style={{ width: 260 }}
          />
          <Segmented
            value={seg}
            onChange={(v) => setSeg(v as any)}
            options={[
              "ทั้งหมด",
              "กำลังพิจารณา",
              "รอการนัดสัมภาษณ์",
              "นัดสัมภาษณ์แล้ว",
              "ผ่าน",
              "ไม่ผ่าน",
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            รีเฟรช
          </Button>
        </Space>
      </div>

      {/* สรุปสั้น ๆ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" className="stat-card">
            <Space>
              <FileSearchOutlined />
              <Text strong>ทั้งหมด</Text>
            </Space>
            <div className="stat-value">{items.length}</div>
          </Card>
        </Col>
        {[
          "กำลังพิจารณา",
          "รอการนัดสัมภาษณ์",
          "นัดสัมภาษณ์แล้ว",
          "ผ่าน",
          "ไม่ผ่าน",
        ].map((s) => (
          <Col xs={12} sm={8} md={6} lg={4} key={s}>
            <Card size="small" className="stat-card">
              <Space>
                <Tag color={statusColor(s)}>{s}</Tag>
              </Space>
              <div className="stat-value">{totalByStatus.get(s) ?? 0}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* รายการการ์ด */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={24} md={12} lg={8} key={i}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Col>
          ))}
        </Row>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty description="ยังไม่มีรายการใบสมัครตามเงื่อนไข" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((it) => (
            <Col xs={24} md={12} lg={8} xl={6} key={it.id}>
              <Card className="app-card" hoverable>
                <div className="app-head">
                  <div className="app-badge">
                    <Tag color={statusColor(it.status)}>{it.status}</Tag>
                    <Text type="secondary">
                      {dayjs(it.date).format("DD MMM YYYY")}
                    </Text>
                  </div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {it.position || "-"}
                  </Title>
                  <Text style={{ color: "#245", fontWeight: 600 }}>
                    {it.company_name}
                  </Text>
                </div>

                {!!it.company_note && (
                  <div className="note">
                    <FileTextOutlined />{" "}
                    <Text type="secondary">{it.company_note}</Text>
                  </div>
                )}

                <div className="files">
                  <Space wrap>
                    <Tooltip title="ดู Resume">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => openPreview("Resume", it.resume_url)}
                        disabled={!it.resume_url}
                      >
                        Resume
                      </Button>
                    </Tooltip>
                    <Tooltip title="ดาวน์โหลด Resume">
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile(it.resume_url)}
                        disabled={!it.resume_url}
                      />
                    </Tooltip>

                    <Tooltip title="ดู Transcript">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() =>
                          openPreview("Transcript", it.TranscriptUrl)
                        }
                        disabled={!it.TranscriptUrl}
                      >
                        Transcript
                      </Button>
                    </Tooltip>
                    <Tooltip title="ดาวน์โหลด Transcript">
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile(it.TranscriptUrl)}
                        disabled={!it.TranscriptUrl}
                      />
                    </Tooltip>
                  </Space>
                </div>

                <div className="footer-line">
                  <Space>
                    {it.status === "กำลังพิจารณา" && <FileSearchOutlined />}
                    {it.status === "ผ่าน" && <FileDoneOutlined />}
                    <Text type="secondary">รหัสใบสมัคร: {it.id}</Text>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Preview Modal */}
      <Modal
        open={preview.open}
        title={preview.open ? preview.title : ""}
        footer={null}
        onCancel={() => setPreview({ open: false })}
        width={720}
      >
        {preview.open && (
          <Image
            src={preview.src}
            alt={preview.title}
            style={{ maxHeight: 600, objectFit: "contain" }}
          />
        )}
      </Modal>

      {/* styles */}
      <style jsx>{`
        .app-details-wrap {
          padding: 16px;
          background: linear-gradient(180deg, #fff 0%, #f7fbff 100%);
          border-radius: 12px;
        }
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          padding: 12px 16px;
          border: 1px solid #e8f1ff;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(22, 119, 255, 0.06);
        }
        .stat-card {
          border: 1px solid #eaf2ff;
        }
        .stat-value {
          font-size: 22px;
          color: #0b2545;
          font-weight: 700;
          margin-top: 6px;
        }
        .app-card {
          border: 1px solid #eaf2ff;
          box-shadow: 0 10px 24px rgba(22, 119, 255, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .app-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(22, 119, 255, 0.12);
        }
        .app-head {
          margin-bottom: 8px;
        }
        .app-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .note {
          background: #f9fbff;
          border: 1px dashed #dbe8ff;
          padding: 8px 10px;
          border-radius: 8px;
          margin: 8px 0 12px;
        }
        .files {
          margin-top: 8px;
        }
        .footer-line {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #eef3ff;
        }
      `}</style>
    </div>
  );
};

export default ApplicationDetailsList;
