import React from "react";
import { LoadingOutlined } from "@ant-design/icons";
import "./SendingEmailProgress.css"; // ใช้ร่วมกับ pulse-icon, verify-loading-text, etc.

const SendingEmailProgress: React.FC = () => {
  return (
    <div className="verify-modal-loading-overlay">
      <div className="pulse-icon">
        <LoadingOutlined
          style={{
            fontSize: 32,
            color: "#1677ff",
            filter: "drop-shadow(0 0 8px rgba(22, 119, 255, 0.3))",
          }}
          spin
        />
      </div>
      <div className="verify-loading-text">กำลังส่งอีเมลและอัปเดตข้อมูล...</div>
      <div className="verify-loading-subtext">กรุณารอสักครู่</div>
    </div>
  );
};

export default SendingEmailProgress;