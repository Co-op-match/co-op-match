import React from "react";
import { Modal, Button, Space, message } from "antd";
import {
  FilePdfOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

interface Document {
  name: string;
  url: string;
  fileType: "pdf" | "image" | string;
}

interface DocumentModalProps {
  open: boolean;
  selectedDocument: Document | null;
  onCancel: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  open,
  selectedDocument,
  onCancel,
}) => {
  const handleDownload = () => {
    if (selectedDocument?.url) {
      const link = document.createElement("a");
      link.href = selectedDocument.url;
      link.download = selectedDocument.name;
      link.click();
      message.success("เริ่มดาวน์โหลดเอกสารแล้ว");
    }
  };

  return (
    <Modal
      title={
        selectedDocument && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {selectedDocument.fileType === "pdf" ? (
              <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: "20px" }} />
            ) : (
              <FileImageOutlined
                style={{ color: "#1677ff", fontSize: "20px" }}
              />
            )}
            <span>{selectedDocument.name}</span>
          </div>
        )
      }
      open={open}
      onCancel={onCancel}
      width={600}
      style={{ top: 20, height: "90vh" }} // 👈 กำหนดสูงสุดของ modal
      styles={{ body: { height: "calc(90vh - 120px)", padding: 0 } }} // 👈 ใช้พื้นที่เต็ม modal body
      footer={
        <Space>
          <Button onClick={onCancel} style={{ borderRadius: "8px" }}>
            ปิด
          </Button>
        </Space>
      }
    >
      {selectedDocument?.url ? (
        <iframe
          title="Verification Document"
          src={
            selectedDocument.url.startsWith("http")
              ? selectedDocument.url
              : `http://localhost:8000${selectedDocument.url}`
          }
          className="adminpage-verify-doc-iframe"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "8px",
            background: "#f0f0f0",
          }}
        />
      ) : (
        <div className="adminpage-verify-no-doc">ไม่มีเอกสาร</div>
      )}
    </Modal>
  );
};

export default DocumentModal;