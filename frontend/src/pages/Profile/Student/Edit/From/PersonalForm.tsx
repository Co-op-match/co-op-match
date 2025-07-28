import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Select, InputNumber } from "antd";
import { GetAllGender } from "../../../../../services/https"; // ✅ path ตามที่คุณมีจริง
import type { GenderInterface } from "../../../../../interfaces/Gender";



const PersonalForm: React.FC<{ form: any }> = ({ form }) => {
  const [genders, setGenders] = useState<GenderInterface[]>([]);

  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const res = await GetAllGender();
        if (res && Array.isArray(res)) {
          setGenders(res);
        }
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลเพศได้", err);
      }
    };
    fetchGenders();
  }, []);

  return (
    <>
      <Form.Item label="ชื่อ" name="first_name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="นามสกุล" name="last_name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="เพศ" name="Gender" rules={[{ required: true }]}>
        <Select placeholder="เลือกเพศ">
          {genders.map((g) => (
            <Select.Option key={g.ID} value={g.ID}>
              {g.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="วันเกิด" name="birthday">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="อายุ" name="age">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="เบอร์โทร" name="phone_number">
        <Input />
      </Form.Item>
    </>
  );
};

export default PersonalForm;
