import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Select, InputNumber, Divider } from "antd";
import { UserOutlined, PhoneOutlined, CalendarOutlined } from "@ant-design/icons";
import { GetAllGender } from "../../../../../services/https";
import type { GenderInterface } from "../../../../../interfaces/Gender";
import dayjs from "dayjs";

interface PersonalFormProps {
  form: any;
  onChange?: () => void;
}

const PersonalForm: React.FC<PersonalFormProps> = ({ form, onChange }) => {
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGenders = async () => {
      try {
        setLoading(true);
        const res = await GetAllGender();
        if (res && Array.isArray(res)) {
          setGenders(res);
        }
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลเพศได้", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenders();
  }, []);

  const handleBirthdayChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const age = dayjs().diff(date, "year");
      form.setFieldsValue({ age });
    } else {
      form.setFieldsValue({ age: undefined });
    }
    onChange?.();
  };

  return (
    <>
      {/* Basic Info Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <UserOutlined style={{ color: "#1890ff" }} />
          ข้อมูลพื้นฐาน
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px"
        }}>
          <Form.Item
            label="ชื่อ"
            name="first_name"
            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
          >
            <Input
              placeholder="กรอกชื่อ"
              size="large"
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item
            label="นามสกุล"
            name="last_name"
            rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
          >
            <Input
              placeholder="กรอกนามสกุล"
              size="large"
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              onChange={onChange}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="เพศ"
          name="Gender"
          rules={[{ required: true, message: "กรุณาเลือกเพศ" }]}
        >
          <Select
            placeholder="เลือกเพศ"
            loading={loading}
            size="large"
            options={genders.map(g => ({
              label: g.name_th,
              value: g.ID
            }))}
            onChange={onChange}
          />
        </Form.Item>
      </div>

      <Divider />

      {/* Personal Details Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CalendarOutlined style={{ color: "#1890ff" }} />
          ข้อมูลส่วนตัว
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "16px"
        }}>
          <Form.Item label="วันเกิด" name="birthday">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="เลือกวันเกิด"
              format="DD/MM/YYYY"
              size="large"
              onChange={handleBirthdayChange}
            />
          </Form.Item>

          <Form.Item label="อายุ" name="age">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="อายุ"
              min={0}
              max={120}
              size="large"
              disabled
            />
          </Form.Item>
        </div>
      </div>

      <Divider />

      {/* Contact Section */}
      <div>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <PhoneOutlined style={{ color: "#1890ff" }} />
          ข้อมูลติดต่อ
        </h4>

        <Form.Item
          label="เบอร์โทรศัพท์"
          name="phone_number"
          rules={[
            { pattern: /^[0-9]{10}$/, message: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก" }
          ]}
        >
          <Input
            placeholder="08XXXXXXXX"
            maxLength={10}
            size="large"
            prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
            onChange={onChange}
          />
        </Form.Item>
      </div>
    </>
  );
};

export default PersonalForm;
