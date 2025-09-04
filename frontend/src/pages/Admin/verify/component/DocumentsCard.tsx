import React from "react";
import { Card, Typography, Button } from "antd";
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface DocumentsCardProps {
  documentUrl: string;
  onView: (url: string) => void;
}

const DocumentsCard: React.FC<DocumentsCardProps> = ({
  documentUrl,
  onView,
}) => {
  const isPdf = documentUrl?.toLowerCase().includes(".pdf");
  const isImage = /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(documentUrl);

  return (
    <Card
      style={{
        marginBottom: "20px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
        background: "white",
        height: "100%"
      }}
      styles={{ body: { padding: "24px" } }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Title
          level={5}
          style={{
            margin: 0,
            color: "#1677ff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileTextOutlined />
          เอกสารแนบ
        </Title>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%)",
          borderRadius: "12px",
          padding: "20px",
          border: "2px dashed #1677ff",
          height: "inherit",
        }}
      >
        <Card
          style={{
            border: "none",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            borderRadius: "12px",
            minHeight: "100%",
          }}
          styles={{ body: { padding: "16px", textAlign: "center" } }}
        >
          {/* 🔍 Preview Area */}
          <div style={{ marginBottom: "16px" }}>
            {isPdf ? (
              <div
                onClick={() => onView(documentUrl)}
                style={{ cursor: "pointer" }}
                title="คลิกเพื่อดูเต็มจอ"
              >
                <iframe
                  src={
                    documentUrl.startsWith("http")
                      ? documentUrl
                      : `http://localhost:8000${documentUrl}`
                  }
                  style={{
                    width: "100%",
                    height: "300px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#f0f0f0",
                    pointerEvents: "none", // เพื่อให้ iframe ไม่ intercept การคลิก
                  }}
                  title="document-preview"
                />
              </div>
            ) : isImage ? (
              <img
                onClick={() => onView(documentUrl)}
                src={
                  documentUrl.startsWith("http")
                    ? documentUrl
                    : `http://localhost:8000${documentUrl}`
                }
                alt="แนบ"
                title="คลิกเพื่อดูเต็มจอ"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  objectFit: "contain",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
              />
            ) : (
              <p>ไม่สามารถแสดงเอกสารได้</p>
            )}
          </div>

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onView(documentUrl)}
              style={{ padding: "0 8px" }}
            >
              ดูเต็มจอ
            </Button>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href={documentUrl}
              target="_blank"
              download
              style={{ padding: "0 8px" }}
            >
              ดาวน์โหลด
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default DocumentsCard;