import React from "react";
import { Modal, Button, Space } from "antd";
import { FilePdfOutlined, FileImageOutlined } from "@ant-design/icons";
import { fileURL } from "@/config/env";

type FileKind = "pdf" | "image" | string;

interface Document { name: string; url: string; fileType: FileKind; }
interface DocumentModalProps { open: boolean; selectedDocument: Document | null; onCancel: () => void; }


const DocumentModal: React.FC<DocumentModalProps> = ({ open, selectedDocument, onCancel }) => {
  const src = fileURL(selectedDocument?.url);
  const isPdf = selectedDocument?.fileType === "pdf";
  const isImage = selectedDocument?.fileType === "image";
  const displayName = selectedDocument?.name ?? "เอกสารแนบ";

  return (
    <Modal
      title={
        selectedDocument ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isPdf ? (
              <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
            ) : (
              <FileImageOutlined style={{ color: "#1677ff", fontSize: 20 }} />
            )}
            <span>{displayName}</span>
          </div>
        ) : null
      }
      open={open}
      onCancel={onCancel}
      width={600}
      style={{ top: 20, height: "90vh" }}
      styles={{ body: { height: "calc(90vh - 120px)", padding: 0 } }}
      footer={
        <Space>
          <Button onClick={onCancel} style={{ borderRadius: 8 }}>ปิด</Button>
        </Space>
      }
    >
      {!src ? (
        <div style={{ padding: 24, textAlign: "center", color: "#999" }}>ไม่มีเอกสาร</div>
      ) : isPdf ? (
        <iframe
          title="verification-document"
          src={src}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 8, background: "#f0f0f0" }}
        />
      ) : isImage ? (
        <div style={{ width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={src}
            alt={displayName}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
          />
        </div>
      ) : (
        <iframe
          title="verification-document"
          src={src}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 8, background: "#f0f0f0" }}
        />
      )}
    </Modal>
  );
};

export default React.memo(DocumentModal);