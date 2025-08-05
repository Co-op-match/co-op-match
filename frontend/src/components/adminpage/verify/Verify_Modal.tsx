import { Modal, Form, Card, Row, Col, Radio, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import React from "react";
import type { CompanyInterface } from "../../../interfaces/Company";
import type { AcademicStaffInterface } from "../../../interfaces/AcademicStaff";
import type { VerifyInterface } from "../../../interfaces/Verify";
import type { RoleInterface } from "../../../interfaces/Role";
import "./Verify.css";
import SendingEmailProgress from "../../SendingEmailProgress";

interface Props {
  open: boolean;
  entity: CompanyInterface | AcademicStaffInterface;
  role: RoleInterface;
  verifyForm: any;
  selectedVerifyStatus: string;
  setSelectedVerifyStatus: (value: string) => void;
  isReadOnlyStatus: boolean;
  setIsDetailModalVisible: (visible: boolean) => void;
  submitVerificationDecision: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

const Verify_Modal: React.FC<Props> = ({
  open,
  entity,
  role,
  verifyForm,
  selectedVerifyStatus,
  setSelectedVerifyStatus,
  isReadOnlyStatus,
  setIsDetailModalVisible,
  submitVerificationDecision,
  isSubmitting = false,
}) => {
  const latest: VerifyInterface | undefined =
    entity?.User?.Verifications?.slice()?.sort(
      (a, b) => dayjs(b.CreatedAt).unix() - dayjs(a.CreatedAt).unix()
    )[0];

  const getDisplayName = () => {
    if (!role) return "-";
    if (role.RoleName === "Company") {
      return (entity as CompanyInterface).company_name ?? "-";
    } else if (role.RoleName === "AcademicStaff") {
      return (entity as AcademicStaffInterface).User?.Email ?? "-";
    }
    return "-";
  };

  if (!entity) return null;

  return (
    <Modal
      open={open}
      title={<div className="adminpage-verify-modal-title">รายละเอียดการรับรอง</div>}
      onCancel={() => {
        if (isSubmitting) return;
        setIsDetailModalVisible(false);
        verifyForm.resetFields();
        setSelectedVerifyStatus("");
      }}
      onOk={async () => {
        if (isReadOnlyStatus || isSubmitting) return;
        try {
          if (selectedVerifyStatus === "ปฏิเสธ") {
            await verifyForm.validateFields();
          }
          const reason = verifyForm.getFieldValue("rejectReason") || "";
          await submitVerificationDecision(reason);
        } catch (err) {}
      }}
      okText={isSubmitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
      cancelText="ยกเลิก"
      footer={isReadOnlyStatus ? null : undefined}
      width={500}
      className="adminpage-modal"
      okButtonProps={{
        className: "adminpage-verify-modal-ok-button",
        loading: isSubmitting,
        disabled: isSubmitting,
      }}
      cancelButtonProps={{
        className: "adminpage-verify-modal-cancel-button",
        disabled: isSubmitting,
      }}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
    >
      {/* Fixed Loading Overlay - ติดกับ Modal */}
      {isSubmitting && <SendingEmailProgress />}

      {/* Top Loading Bar */}
      {isSubmitting && (
        <div className="adminpage-verify-loading-bar">
          <div className="adminpage-verify-loading-bar-progress"></div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Form form={verifyForm} layout="vertical">
          <Card
            className="adminpage-company-info-card"
            styles={{ body: { padding: "20px" } }}
          >
            <div className="adminpage-verify-section-label">
              ข้อมูล{role?.RoleNameTH ?? "ผู้ใช้"}
            </div>
            <div
              style={{ fontSize: "18px", color: "#1677ff", fontWeight: "500" }}
            >
              {getDisplayName()}
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
                    <div className="adminpage-verify-status-title">สถานะ</div>
                    <div style={{ fontSize: "16px", fontWeight: "600" }}>
                      {latest?.StatusVerify?.status_verify || "ไม่ทราบสถานะ"}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ borderRadius: "8px" }}>
                    <div className="adminpage-verify-status-title">วันที่ส่งคำขอ</div>
                    <div style={{ fontSize: "16px", fontWeight: "600" }}>
                      {dayjs(latest?.CreatedAt).format("DD/MM/YYYY HH:mm")}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Card
                title={`เอกสารการยืนยันของ${role?.RoleNameTH ?? "ผู้ใช้"}`}
                style={{ borderRadius: "12px", marginBottom: "20px" }}
              >
                {latest.verification_document ? (
                  <iframe
                    title="Verification Document"
                    src={`http://localhost:8000${latest.verification_document}`}
                    className="adminpage-verify-doc-iframe"
                  />
                ) : (
                  <div className="adminpage-verify-no-doc">ไม่มีเอกสาร</div>
                )}
              </Card>

              <Card title="การตัดสินใจ" style={{ borderRadius: "12px" }}>
                <Radio.Group
                  onChange={(e) => {
                    if (isSubmitting) return;
                    setSelectedVerifyStatus(e.target.value);
                    if (e.target.value !== "ปฏิเสธ") {
                      verifyForm.resetFields(["rejectReason"]);
                    }
                  }}
                  value={selectedVerifyStatus}
                  disabled={isReadOnlyStatus || isSubmitting}
                  style={{ width: "100%" }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card
                        style={{
                          cursor:
                            isReadOnlyStatus || isSubmitting
                              ? "not-allowed"
                              : "pointer",
                          border:
                            selectedVerifyStatus === "รับรอง"
                              ? "2px solid #1677ff"
                              : "1px solid #d9d9d9",
                          borderRadius: "8px",
                          opacity: isSubmitting ? 0.6 : 1,
                        }}
                        onClick={() =>
                          !isReadOnlyStatus &&
                          !isSubmitting &&
                          setSelectedVerifyStatus("รับรอง")
                        }
                        styles={{
                          body: { padding: "16px", textAlign: "center" },
                        }}
                      >
                        <Radio
                          value="รับรอง"
                          className={
                            selectedVerifyStatus === "รับรอง"
                              ? "adminpage-radio-ok"
                              : undefined
                          }
                          style={{ fontSize: "16px" }}
                        >
                          รับรอง
                        </Radio>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        style={{
                          cursor:
                            isReadOnlyStatus || isSubmitting
                              ? "not-allowed"
                              : "pointer",
                          border:
                            selectedVerifyStatus === "ปฏิเสธ"
                              ? "2px solid #ff4d4f"
                              : "1px solid #d9d9d9",
                          borderRadius: "8px",
                          opacity: isSubmitting ? 0.6 : 1,
                        }}
                        onClick={() =>
                          !isReadOnlyStatus &&
                          !isSubmitting &&
                          setSelectedVerifyStatus("ปฏิเสธ")
                        }
                        styles={{
                          body: { padding: "16px", textAlign: "center" },
                        }}
                      >
                        <Radio
                          value="ปฏิเสธ"
                          className={
                            selectedVerifyStatus === "ปฏิเสธ"
                              ? "adminpage-radio-danger"
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
                      disabled={isReadOnlyStatus || isSubmitting}
                      style={{
                        borderRadius: "8px",
                        border: "2px solid #ffebe6",
                        resize: "none",
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                    />
                  </Form.Item>
                )}
              </Card>
            </>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default Verify_Modal;