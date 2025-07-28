import React, { useEffect } from "react";
import { Modal, Form } from "antd";
import PersonalForm from "../Edit/From/PersonalForm";
import EducationForm from "../Edit/From/EducationForm";
import AddressForm from "../Edit/From/AddressForm";
import type { StudentInterface } from "../../../../interfaces/Student";
import dayjs from "dayjs";
import { UpdateStudent } from "../../../../services/https"; // ✅ เพิ่มตรงนี้

interface EditProfileModalProps {
  open: boolean;
  section: "personal" | "education" | "address";
  onClose: () => void;
  initialData?: StudentInterface;
}

const sectionTitleMap: Record<string, string> = {
  personal: "แก้ไขข้อมูลส่วนตัว",
  education: "แก้ไขข้อมูลการศึกษา",
  address: "แก้ไขที่อยู่",
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  section,
  onClose,
  initialData,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialData) {
      const firstEducation = initialData.Education?.[0];
      form.setFieldsValue({
        ...initialData,
        ...firstEducation,
        ...initialData.Address,
        birthday: initialData.birthday ? dayjs(initialData.birthday) : null,
        Gender: initialData.Gender?.ID, // ✅ เปลี่ยนจาก name → ID
        SubDistrict: initialData.Address?.SubDistrict?.name_th,
        District: initialData.Address?.District?.name_th,
        Province: initialData.Address?.Province?.name_th,
        Postcode: initialData.Address?.Postcode?.post_code,
      });
    }
  }, [open, initialData, form]);

  const renderForm = () => {
    switch (section) {
      case "personal":
        return <PersonalForm form={form} />;
      case "education":
        return <EducationForm form={form} />;
      case "address":
        return <AddressForm form={form} />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const userId = Number(localStorage.getItem("id"));
      if (!userId) throw new Error("Missing user ID");

      if (section === "personal") {
        const payload = {
            first_name: values.first_name,
            last_name: values.last_name,
            phone_number: values.phone_number,
            birthday: values.birthday?.toISOString(),
            age: values.age,
            gender_id: values.Gender, // ✅ ใช้ gender_id แทน Gender
        };

        await UpdateStudent(userId, payload as StudentInterface); // ✅ แปลง type ชัดเจน
        console.log("✅ Updated personal info:", payload);
        }
      onClose();
    } catch (err) {
      console.error("❌ Validation Error or Update Failed", err);
    }
  };

  return (
    <Modal
      title={sectionTitleMap[section] || "แก้ไขข้อมูล"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
    >
      <Form layout="vertical" form={form}>
        {renderForm()}
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
