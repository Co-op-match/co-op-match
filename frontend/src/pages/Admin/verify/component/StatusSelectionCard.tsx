import React from "react";
import { Card, Typography, Radio, Space, Divider, Form, Input } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  selectedStatus: StatusVerifyInterface | undefined;
  setSelectedStatus: React.Dispatch<React.SetStateAction<StatusVerifyInterface | undefined>>;
  statusVerifications: StatusVerifyInterface[];
  loading?: boolean;
  isReadOnlyStatus?: boolean;
  verifyForm: any;
  rejectReason: string;
  setRejectReason: (value: string) => void;
}

const StatusSelectionCard: React.FC<Props> = ({
  selectedStatus,
  setSelectedStatus,
  statusVerifications,
  loading,
  isReadOnlyStatus,
  verifyForm,
  rejectReason,
  setRejectReason,
}) => {
  const findStatus = (label: "รับรอง" | "ปฏิเสธ") =>
    statusVerifications.find((s) => s.status_verify === label);

  const setStatus = (label: "รับรอง" | "ปฏิเสธ") => setSelectedStatus(findStatus(label));

  const disabled = Boolean(isReadOnlyStatus || loading);
  const isSelected = (label: "รับรอง" | "ปฏิเสธ") => selectedStatus?.status_verify === label;

  const cards: Array<{
    label: "รับรอง" | "ปฏิเสธ";
    title: string;
    activeBorder: string;
    activeBg: string;
  }> = [
    {
      label: "รับรอง",
      title: "อนุมัติการรับรอง",
      activeBorder: "#52c41a",
      activeBg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
    },
    {
      label: "ปฏิเสธ",
      title: "ปฏิเสธการรับรอง",
      activeBorder: "#ff4d4f",
      activeBg: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)",
    },
  ];

  return (
    <Card
      style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "none", background: "#fff" }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: "#1677ff", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircleOutlined />
          เลือกสถานะการอนุมัติ
        </Title>
      </div>

      <Form form={verifyForm} layout="vertical">
        <Radio.Group
          name="status_verify"
          value={selectedStatus?.status_verify}
          disabled={disabled}
          style={{ width: "100%" }}
          onChange={(e) => {
            const val = e.target.value as "รับรอง" | "ปฏิเสธ";
            setStatus(val);
            if (val !== "ปฏิเสธ") {
              verifyForm?.resetFields?.(["reason"]);
              setRejectReason("");
            }
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {cards.map(({ label, title, activeBorder, activeBg }) => (
              <Card
                key={label}
                onClick={() => !disabled && setStatus(label)}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  border: isSelected(label) ? `2px solid ${activeBorder}` : "1px solid #d9d9d9",
                  borderRadius: 12,
                  opacity: loading ? 0.6 : 1,
                  background: isSelected(label) ? activeBg : "#fff",
                  transition: "all 0.3s ease",
                }}
                styles={{ body: { padding: 16, textAlign: "center" } }}
              >
                <Radio value={label} style={{ fontSize: 14, fontWeight: 600 }}>
                  {title}
                </Radio>
              </Card>
            ))}
          </Space>
        </Radio.Group>

        {selectedStatus?.status_verify === "ปฏิเสธ" && (
          <div style={{ marginTop: 20 }}>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: "#ff4d4f", fontSize: 14 }}>
                <CloseCircleOutlined style={{ marginRight: 6 }} />
                เหตุผลการปฏิเสธ *
              </Text>
            </div>

            <Form.Item
              name="reason"
              rules={[
                { required: true, message: "กรุณากรอกเหตุผลการปฏิเสธ" },
                { min: 10, message: "เหตุผลการปฏิเสธต้องมีอย่างน้อย 10 ตัวอักษร" },
                { max: 500, message: "เหตุผลการปฏิเสธต้องไม่เกิน 500 ตัวอักษร" },
              ]}
              style={{ margin: 0 }}
            >
              <TextArea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธการรับรองอย่างชัดเจน เช่น เอกสารไม่ชัดเจน, ข้อมูลไม่ถูกต้อง, หรือเอกสารไม่ครบถ้วน"
                rows={4}
                disabled={loading}
                showCount
                maxLength={500}
                style={{
                  borderRadius: 8,
                  fontSize: 14,
                  background: "linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)",
                  border: "1px solid #ff7875",
                }}
              />
            </Form.Item>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default StatusSelectionCard;