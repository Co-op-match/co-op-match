import React, { useMemo } from "react";
import { Card, Typography, Button, Space } from "antd";
import { FileTextOutlined, ExportOutlined, DownloadOutlined } from "@ant-design/icons";
import { fileURL, getExtension } from "@/config/env";

const { Title } = Typography;

interface DocumentsCardProps {
  documentUrl: string;
}

/** สร้าง URL สำหรับ PDF viewer โดยกำหนด hash params ได้ */
const buildPdfUrl = (
  url: string,
  opts: { zoom?: string; toolbar?: "0" | "1"; navpanes?: "0" | "1" } = {}
) => {
  const [base, hash = ""] = url.split("#");
  const q = new URLSearchParams(hash);
  if (opts.zoom) q.set("zoom", opts.zoom);          // "page-width" | "100" | ฯลฯ
  if (opts.toolbar) q.set("toolbar", opts.toolbar); // 0|1
  if (opts.navpanes) q.set("navpanes", opts.navpanes);
  return `${base}#${q.toString()}`;
};

/** ดึงชื่อไฟล์จาก URL */
const getFilename = (url: string) => {
  try {
    const u = new URL(url, window.location.origin);
    const p = u.pathname.split("/").filter(Boolean);
    return p[p.length - 1] || "document";
  } catch {
    const parts = url.split("?")[0].split("#")[0].split("/");
    return parts[parts.length - 1] || "document";
  }
};

const DocumentsCard: React.FC<DocumentsCardProps> = ({ documentUrl }) => {
  const rawSrc = useMemo(() => fileURL(documentUrl), [documentUrl]);
  const ext = useMemo(() => getExtension(documentUrl), [documentUrl]);
  const isPdf = ext === "pdf";
  const isImage = ["jpeg", "jpg", "png", "gif", "bmp", "webp"].includes(ext);

  // 👉 Preview ในการ์ด: fit width + ซ่อน toolbar/nav
  const previewSrc = useMemo(() => {
    if (!rawSrc) return "";
    return isPdf
      ? buildPdfUrl(rawSrc, { zoom: "page-width", toolbar: "0", navpanes: "0" })
      : rawSrc;
  }, [rawSrc, isPdf]);

  // 👉 เปิดเต็มจอ: 100% + แสดง toolbar/nav
  const fullSrc = useMemo(() => {
    if (!rawSrc) return "";
    return isPdf
      ? buildPdfUrl(rawSrc, { zoom: "100", toolbar: "1", navpanes: "1" })
      : rawSrc;
  }, [rawSrc, isPdf]);

  const handleOpenFull = () => {
    if (!fullSrc) return;
    window.open(fullSrc, "_blank", "noopener,noreferrer");
  };

  // 👉 ดาวน์โหลดลงคอม (Blob)
  const handleDirectDownload = async () => {
    if (!rawSrc) return;
    try {
      const res = await fetch(rawSrc, { mode: "cors" });
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = getFilename(rawSrc);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      // fallback ถ้าโดน CORS/headers บล็อก
      window.open(rawSrc, "_blank", "noopener,noreferrer");
    }
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
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title
          level={5}
          style={{
            margin: 0,
            color: "rgb(30, 58, 138)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileTextOutlined />
          เอกสารแนบ
        </Title>
      </div>

      {/* Content */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%)",
          borderRadius: 12,
          padding: 20,
          border: "2px dashed rgb(30, 58, 138)",
        }}
      >
        <Card
          style={{
            border: "none",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            borderRadius: 12,
          }}
          styles={{ body: { padding: 16 } }}
        >
          {/* Preview */}
          <div style={{ marginBottom: 16 }}>
            {!previewSrc ? (
              <p style={{ textAlign: "center" }}>ไม่พบเอกสาร</p>
            ) : isPdf ? (
              <iframe
                title="document-preview"
                src={previewSrc}
                style={{
                  width: "100%",
                  height: "min(60vh, 900px)",
                  border: "none",
                  borderRadius: 8,
                  display: "block",
                  overflow: "hidden",
                  background: "#fff",
                }}
              />
            ) : isImage ? (
              <img
                src={previewSrc}
                alt="แนบ"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "80vh",
                  borderRadius: 8,
                  objectFit: "contain",
                  display: "block",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            ) : (
              <p style={{ textAlign: "center" }}>ไม่สามารถแสดงเอกสารได้</p>
            )}
          </div>

          {/* Actions – ปุ่ม UI ปรับปรุง */}
          {rawSrc && (
            <Space
              align="center"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <Button
                type="default"
                icon={<ExportOutlined />}
                onClick={handleOpenFull}
                style={{
                  borderRadius: 8,
                  padding: "6px 16px",
                  fontWeight: 500,
                }}
              >
                เปิดเต็มจอ
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDirectDownload}
                style={{
                  borderRadius: 8,
                  padding: "6px 20px",
                  fontWeight: 500,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                ดาวน์โหลด
              </Button>
            </Space>
          )}
        </Card>
      </div>
    </Card>
  );
};

export default React.memo(DocumentsCard);