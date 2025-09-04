import React, { useMemo } from "react";
import { Card, Typography, Button } from "antd";
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface DocumentsCardProps {
  documentUrl: string;
  onView: (url: string) => void;
}

const API_BASE_URL = "http://localhost:8000";

const normalizeUrl = (url?: string) => (!url ? "" : url.startsWith("http") ? url : `${API_BASE_URL}${url}`);
const extFromUrl = (url: string) => {
  try {
    const u = new URL(normalizeUrl(url));
    const pathname = u.pathname.toLowerCase();
    return pathname.substring(pathname.lastIndexOf(".") + 1);
  } catch {
    const raw = url.toLowerCase().split("?")[0].split("#")[0];
    return raw.substring(raw.lastIndexOf(".") + 1);
  }
};

const DocumentsCard: React.FC<DocumentsCardProps> = ({ documentUrl, onView }) => {
  const src = useMemo(() => normalizeUrl(documentUrl), [documentUrl]);
  const ext = useMemo(() => (documentUrl ? extFromUrl(documentUrl) : ""), [documentUrl]);
  const isPdf = ext === "pdf";
  const isImage = ["jpeg", "jpg", "png", "gif", "bmp", "webp"].includes(ext);

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = ""; // ปล่อยว่างให้ browser ตัดสินชื่อไฟล์เอง
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
        background: "#fff",
        height: "100%",
      }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: "#1677ff", display: "flex", alignItems: "center", gap: 8 }}>
          <FileTextOutlined />
          เอกสารแนบ
        </Title>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%)",
          borderRadius: 12,
          padding: 20,
          border: "2px dashed #1677ff",
          height: "inherit",
        }}
      >
        <Card
          style={{
            border: "none",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            borderRadius: 12,
            minHeight: "100%",
          }}
          styles={{ body: { padding: 16, textAlign: "center" } }}
        >
          {/* Preview */}
          <div style={{ marginBottom: 16 }}>
            {!src ? (
              <p>ไม่พบเอกสาร</p>
            ) : isPdf ? (
              <div onClick={() => onView(documentUrl)} style={{ cursor: "pointer" }} title="คลิกเพื่อดูเต็มจอ">
                <iframe
                  title="document-preview"
                  src={src}
                  style={{ width: "100%", height: 300, border: "none", borderRadius: 8, background: "#f0f0f0", pointerEvents: "none" }}
                />
              </div>
            ) : isImage ? (
              <img
                onClick={() => onView(documentUrl)}
                src={src}
                alt="แนบ"
                title="คลิกเพื่อดูเต็มจอ"
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, objectFit: "contain", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer" }}
              />
            ) : (
              <p>ไม่สามารถแสดงเอกสารได้</p>
            )}
          </div>

          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8 }}>
            {src && (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => onView(documentUrl)} style={{ padding: "0 8px" }}>
                  ดูเต็มจอ
                </Button>
                <Button type="link" icon={<DownloadOutlined />} onClick={handleDownload} style={{ padding: "0 8px" }}>
                  ดาวน์โหลด
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default React.memo(DocumentsCard);