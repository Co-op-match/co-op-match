// components/Company/VerifyCompanyModal.tsx
import { Modal, Form, Card, Row, Col, Radio, Input } from "antd";
import dayjs from "dayjs";
import React from "react";
import type { CompanyInterface } from "../../../../interfaces/Company";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import "../users.css";

interface Props {
  open: boolean;
  currentCompany?: CompanyInterface | undefined;
  verifyForm: any;
  selectedVerifyStatus: string;
  setSelectedVerifyStatus: (value: string) => void;
  isReadOnlyStatus: boolean;
  setIsDetailModalVisible: (visible: boolean) => void;
  submitVerificationDecision: (reason: string) => Promise<void>;
}

const VerifyCompanyModal: React.FC<Props> = ({
  open,
  currentCompany,
  verifyForm,
  selectedVerifyStatus,
  setSelectedVerifyStatus,
  isReadOnlyStatus,
  setIsDetailModalVisible,
  submitVerificationDecision,
}) => {
  const latest: VerifyInterface | undefined =
    currentCompany?.User?.Verifications?.slice()?.sort(
      (a, b) => dayjs(b.CreatedAt).unix() - dayjs(a.CreatedAt).unix()
    )[0];

  return (
    <Modal
      open={open}
      title={<div className="verify-modal-title">รายละเอียดการรับรอง</div>}
      onCancel={() => {
        setIsDetailModalVisible(false);
        verifyForm.resetFields();
        setSelectedVerifyStatus("");
      }}
      onOk={async () => {
        if (isReadOnlyStatus) return;
        try {
          if (selectedVerifyStatus === "ปฏิเสธ") {
            await verifyForm.validateFields();
          }
          const reason = verifyForm.getFieldValue("rejectReason") || "";
          await submitVerificationDecision(reason);
        } catch (err) {}
      }}
      okText="ยืนยัน"
      cancelText="ยกเลิก"
      footer={isReadOnlyStatus ? null : undefined}
      width={500}
      className="adminpage-modal"
      okButtonProps={{
        className: "verify-modal-ok-button",
      }}
      cancelButtonProps={{
        className: "verify-modal-cancel-button",
      }}
    >
      <Form form={verifyForm} layout="vertical">
        <Card
          className="company-info-card"
          styles={{ body: { padding: "20px" } }}
        >
          <div className="verify-section-label">ข้อมูลบริษัท</div>
          <div
            style={{ fontSize: "18px", color: "#1677ff", fontWeight: "500" }}
          >
            {currentCompany?.company_name}
          </div>
        </Card>

        {!latest ? (
          <Card style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "16px", color: "#999" }}>
              ยังไม่มีการส่งคำขอรับรอง
            </div>
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: "8px" }}>
                  <div className="verify-status-title">สถานะ</div>
                  <div style={{ fontSize: "16px", fontWeight: "600" }}>
                    {latest?.StatusVerify?.status_verify || "ไม่ทราบสถานะ"}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: "8px" }}>
                  <div className="verify-status-title">วันที่ส่งคำขอ</div>
                  <div style={{ fontSize: "16px", fontWeight: "600" }}>
                    {dayjs(latest?.CreatedAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                </Card>
              </Col>
            </Row>

            <Card
              title="เอกสารการยืนยัน"
              style={{ borderRadius: "12px", marginBottom: "20px" }}
            >
              {latest.verification_document ? (
                <iframe
                  title="Verification Document"
                  src={`http://localhost:8000${latest.verification_document}`}
                  className="verify-doc-iframe"
                />
              ) : (
                <div className="verify-no-doc">ไม่มีเอกสาร</div>
              )}
            </Card>

            <Card title="การตัดสินใจ" style={{ borderRadius: "12px" }}>
              <Radio.Group
                onChange={(e) => {
                  setSelectedVerifyStatus(e.target.value);
                  if (e.target.value !== "ปฏิเสธ") {
                    verifyForm.resetFields(["rejectReason"]);
                  }
                }}
                value={selectedVerifyStatus}
                disabled={isReadOnlyStatus}
                style={{ width: "100%" }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card
                      style={{
                        cursor: isReadOnlyStatus ? "not-allowed" : "pointer",
                        border:
                          selectedVerifyStatus === "รับรอง"
                            ? "2px solid #1677ff"
                            : "1px solid #d9d9d9",
                        borderRadius: "8px",
                      }}
                      onClick={() =>
                        !isReadOnlyStatus && setSelectedVerifyStatus("รับรอง")
                      }
                      styles={{
                        body: { padding: "16px", textAlign: "center" },
                      }}
                    >
                      <Radio value="รับรอง" style={{ fontSize: "16px" }}>
                        รับรอง
                      </Radio>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      style={{
                        cursor: isReadOnlyStatus ? "not-allowed" : "pointer",
                        border:
                          selectedVerifyStatus === "ปฏิเสธ"
                            ? "2px solid #ff4d4f"
                            : "1px solid #d9d9d9",
                        borderRadius: "8px",
                      }}
                      onClick={() =>
                        !isReadOnlyStatus && setSelectedVerifyStatus("ปฏิเสธ")
                      }
                      styles={{
                        body: { padding: "16px", textAlign: "center" },
                      }}
                    >
                      <Radio
                        value="ปฏิเสธ"
                        className={
                          selectedVerifyStatus === "ปฏิเสธ"
                            ? "radio-danger"
                            : undefined
                        }
                        style={{ fontSize: "16px" }}
                      >
                        ปฏิเสธ
                      </Radio>
                    </Card>
                  </Col>
                </Row>
              </Radio.Group>

              {selectedVerifyStatus === "ปฏิเสธ" && (
                <Form.Item
                  name="rejectReason"
                  label="เหตุผลในการปฏิเสธ"
                  rules={[
                    { required: true, message: "กรุณาระบุเหตุผลในการปฏิเสธ" },
                  ]}
                  style={{ marginTop: "20px" }}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="กรุณาระบุเหตุผลในการปฏิเสธอย่างชัดเจน..."
                    disabled={isReadOnlyStatus}
                    style={{
                      borderRadius: "8px",
                      border: "2px solid #ffebe6",
                      resize: "none",
                    }}
                  />
                </Form.Item>
              )}
            </Card>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default VerifyCompanyModal;
