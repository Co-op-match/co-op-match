import React from "react";
import { Card, Typography, Radio, Space, Divider, Form, Input } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  selectedStatus: StatusVerifyInterface | undefined;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<StatusVerifyInterface | undefined>
  >;
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
  setRejectReason,
}) => {
  return (
    <Card
      style={{
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
        background: "white",
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
          <CheckCircleOutlined />
          เลือกสถานะการอนุมัติ
        </Title>
      </div>

      <Form form={verifyForm} layout="vertical">
        <Radio.Group
          onChange={(e) => {
            if (loading) return;
            const selected = ["รับรอง", "ปฏิเสธ"].find(
              (v) => v === e.target.value
            );
            if (selected) {
              setSelectedStatus(
                statusVerifications.find((s) => s.status_verify === selected)
              );
            }
            if (e.target.value !== "ปฏิเสธ") {
              verifyForm?.resetFields(["reason"]);
              setRejectReason("");
            }
          }}
          name="status_verify"
          value={selectedStatus?.status_verify}
          disabled={isReadOnlyStatus || loading}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {/* รับรอง */}
            <Card
              style={{
                cursor: isReadOnlyStatus || loading ? "not-allowed" : "pointer",
                border:
                  selectedStatus?.status_verify === "รับรอง"
                    ? "2px solid #52c41a"
                    : "1px solid #d9d9d9",
                borderRadius: "12px",
                opacity: loading ? 0.6 : 1,
                background:
                  selectedStatus?.status_verify === "รับรอง"
                    ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)"
                    : "white",
                transition: "all 0.3s ease",
              }}
              onClick={() =>
                !isReadOnlyStatus &&
                !loading &&
                setSelectedStatus(
                  statusVerifications.find((s) => s.status_verify === "รับรอง")
                )
              }
              styles={{ body: { padding: "16px", textAlign: "center" } }}
            >
              <Radio
                value="รับรอง"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                อนุมัติการรับรอง
              </Radio>
            </Card>

            {/* ปฏิเสธ */}
            <Card
              style={{
                cursor: isReadOnlyStatus || loading ? "not-allowed" : "pointer",
                border:
                  selectedStatus?.status_verify === "ปฏิเสธ"
                    ? "2px solid #ff4d4f"
                    : "1px solid #d9d9d9",
                borderRadius: "12px",
                opacity: loading ? 0.6 : 1,
                background:
                  selectedStatus?.status_verify === "ปฏิเสธ"
                    ? "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)"
                    : "white",
                transition: "all 0.3s ease",
              }}
              onClick={() =>
                !isReadOnlyStatus &&
                !loading &&
                setSelectedStatus(
                  statusVerifications.find((s) => s.status_verify === "ปฏิเสธ")
                )
              }
              styles={{ body: { padding: "16px", textAlign: "center" } }}
            >
              <Radio
                value="ปฏิเสธ"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                ปฏิเสธการรับรอง
              </Radio>
            </Card>
          </Space>
        </Radio.Group>

        {/* เหตุผลการปฏิเสธ */}
        {selectedStatus?.status_verify === "ปฏิเสธ" && (
          <div style={{ marginTop: "20px" }}>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ marginBottom: "12px" }}>
              <Text strong style={{ color: "#ff4d4f", fontSize: "14px" }}>
                <CloseCircleOutlined style={{ marginRight: "6px" }} />
                เหตุผลการปฏิเสธ *
              </Text>
            </div>

            <Form.Item
              name="reason"
              rules={[
                {
                  required: selectedStatus?.status_verify === "ปฏิเสธ",
                  message: "กรุณากรอกเหตุผลการปฏิเสธ",
                },
                {
                  min: 10,
                  message: "เหตุผลการปฏิเสธต้องมีอย่างน้อย 10 ตัวอักษร",
                },
                {
                  max: 500,
                  message: "เหตุผลการปฏิเสธต้องไม่เกิน 500 ตัวอักษร",
                },
              ]}
              style={{ margin: 0 }}
            >
              <TextArea
                value="reason"
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธการรับรองอย่างชัดเจน เช่น เอกสารไม่ชัดเจน, ข้อมูลไม่ถูกต้อง, หรือเอกสารไม่ครบถ้วน"
                rows={4}
                disabled={loading}
                showCount
                maxLength={500}
                style={{
                  borderRadius: "8px",
                  fontSize: "14px",
                  background:
                    selectedStatus?.status_verify === "ปฏิเสธ"
                      ? "linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)"
                      : "white",
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