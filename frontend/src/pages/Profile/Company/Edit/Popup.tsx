import React, { useEffect, useState } from "react";
import { Modal, Form, Button, Space, message } from "antd";
import {
  UserOutlined,
  BookOutlined,
  HomeOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import AddressForm from "../../Student/Edit/From/AddressForm";
import {
  UpdateAddress,
  UpdateContact,
} from "../../../../services/https";
import type { CompanyInterface } from "../../../../interfaces/Company";
import ContactForm from "./from/ContactForm";

// ✅ เพิ่ม Loader
import { CoopMatchLoader } from '../../../../components/loaders';

interface EditProfileModalProps {
  open: boolean;
  section: "contact" | "address";
  onClose: () => void;
  onUpdateSuccess?: () => void;
  initialData?: CompanyInterface;
}

const SECTION_CONFIG = {
  contact: {
    title: "แก้ไขข้อมูลติดต่อ",
    icon: <UserOutlined />,
    color: "#1890ff",
    description: "ข้อมูลพื้นฐานและข้อมูลติดต่อ",
  },
  education: {
    title: "แก้ไขข้อมูลการศึกษา",
    icon: <BookOutlined />,
    color: "#1890ff",
    description: "ข้อมูลมหาวิทยาลัยและการศึกษา",
  },
  address: {
    title: "แก้ไขที่อยู่",
    icon: <HomeOutlined />,
    color: "#1890ff",
    description: "ที่อยู่ปัจจุบันและข้อมูลที่ตั้ง",
  },
};

const EditProfileCompanyModal: React.FC<EditProfileModalProps> = ({
  open,
  section,
  onClose,
  onUpdateSuccess,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string>("กำลังบันทึกข้อมูล...");
  const [formChanged, setFormChanged] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [submitValues, setSubmitValues] = useState<any>(null);

  const sectionConfig = SECTION_CONFIG[section];

  useEffect(() => {
    if (open && initialData) {
      form.setFieldsValue({
        ...initialData,
        ...initialData.Address,
        SubDistrict: initialData.Address?.SubDistrict?.name_th,
        District: initialData.Address?.District?.name_th,
        Province: initialData.Address?.Province?.name_th,
        Postcode: initialData.Address?.Postcode?.post_code,
      });
      setFormChanged(false);
    }
  }, [open, initialData, form]);

  const handleFormChange = () => {
    setFormChanged(true);
  };

  const renderForm = () => {
    const commonProps = { form, initialData, onChange: handleFormChange };
    switch (section) {
      case "contact":
        return <ContactForm {...commonProps} />;
      case "address":
        return <AddressForm {...commonProps} />;
      default:
        return null;
    }
  };

  const handleContactSubmit = async (values: any, userId: number) => {
    const payload = {
      phone_number: values.phone_number,
      website: values.website,
      email: values.email,
      line: values.line,
      facebook: values.facebook,
    };
    await UpdateContact(userId, payload);
    messageApi.success("บันทึกข้อมูลติดต่อบริษัทสำเร็จ!");
  };

  const handleAddressSubmit = async (values: any, userId: number, roleId: number) => {
    const payload = {
      house_number: values.house_number,
      village: values.village,
      street: values.street,
      sub_street: values.sub_street,
      province_id: values.province_id,
      district_id: values.district_id,
      subdistrict_id: values.subdistrict_id,
      postcode_id: values.postcode_id,
    };
    await UpdateAddress(roleId, userId, payload);
    messageApi.success("บันทึกข้อมูลที่อยู่สำเร็จ!");
  };

  const doSubmit = async (values: any) => {
    const userId = Number(localStorage.getItem("id"));
    const roleId = Number(localStorage.getItem("roleId"));

    try {
      setLoading(true);
      setLoadingText(section === "contact" ? "กำลังบันทึกข้อมูลติดต่อ..." : "กำลังบันทึกที่อยู่...");

      switch (section) {
        case "contact":
          await handleContactSubmit(values, userId);
          break;
        case "address":
          await handleAddressSubmit(values, userId, roleId);
          break;
      }
      
      setFormChanged(false);
      
      // ✅ Optimistic Update: แจ้ง parent ให้อัปเดตข้อมูลทันที
      onUpdateSuccess?.();
      
      onClose();
    } catch (err) {
      console.error("❌ Update Failed", err);
      messageApi.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
      setLoadingText("กำลังบันทึกข้อมูล...");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (formChanged) {
        setSubmitValues(values);
        setShowSaveConfirm(true);
      } else {
        await doSubmit(values);
      }
    } catch {
      messageApi.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };

  const handleCancel = () => {
    if (formChanged) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      {contextHolder}

      {/* ✅ Loader Overlay */}
      {loading && (
        <CoopMatchLoader
          overlay
          animation="piece-rotate"
          progressMode="indeterminate"
          text={loadingText}
          // primaryColor="#1890ff"
          // speed={2.0}
        />
      )}

      <Modal
        open={open}
        onCancel={handleCancel}
        width={600}
        footer={null}
        closeIcon={<CloseOutlined />}
        style={{ top: 20 }}
        maskClosable
        keyboard
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${sectionConfig.color}15 0%, ${sectionConfig.color}05 100%)`,
            margin: "-24px -24px 24px -24px",
            padding: "24px",
            borderBottom: `3px solid ${sectionConfig.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                fontSize: "24px",
                color: sectionConfig.color,
                background: "white",
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {sectionConfig.icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#262626" }}>
                {sectionConfig.title}
              </h2>
              <p style={{ margin: 0, color: "#8c8c8c", fontSize: "14px" }}>
                {sectionConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* ❌ เอา Spin ออกเพื่อไม่ให้ซ้อนกับ Loader */}
        <div style={{ background: "#fafafa", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
          <Form
            layout="vertical"
            form={form}
            onValuesChange={handleFormChange}
            requiredMark="optional"
            scrollToFirstError
          >
            {renderForm()}
          </Form>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div>
            {formChanged && (
              <span style={{ color: "#fa8c16", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", background: "#fa8c16", borderRadius: "50%" }} />
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>

          <Space>
            <Button onClick={handleCancel} size="large">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              size="large"
              icon={<SaveOutlined />}
              style={{ background: sectionConfig.color, borderColor: sectionConfig.color }}
            >
              บันทึกข้อมูล
            </Button>
          </Space>
        </div>
      </Modal>

      <Modal
        centered
        open={showSaveConfirm}
        onCancel={() => setShowSaveConfirm(false)}
        onOk={async () => {
          setShowSaveConfirm(false);
          if (submitValues) await doSubmit(submitValues);
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
        title="ยืนยันการบันทึก"
      >
        คุณต้องการบันทึกข้อมูลที่แก้ไขหรือไม่?
      </Modal>

      <Modal
        centered
        open={showCancelConfirm}
        onCancel={() => setShowCancelConfirm(false)}
        onOk={() => {
          form.resetFields();
          setFormChanged(false);
          setShowCancelConfirm(false);
          onClose();
        }}
        okText="ยกเลิก"
        cancelText="กลับไปแก้ไข"
        okType="danger"
        title="ยืนยันการยกเลิก"
      >
        คุณมีการแก้ไขข้อมูลที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?
      </Modal>
    </>
  );
};

export default EditProfileCompanyModal;
