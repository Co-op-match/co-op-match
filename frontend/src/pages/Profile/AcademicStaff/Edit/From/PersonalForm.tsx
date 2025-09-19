import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Select, InputNumber, Divider, Space } from "antd";
import { UserOutlined, PhoneOutlined, CalendarOutlined } from "@ant-design/icons";
import { GetAllGender, GetUniversity } from "../../../../../services/https";
import type { GenderInterface } from "../../../../../interfaces/Gender";
import dayjs from "dayjs";

interface PersonalFormProps {
  form: any;
  initialData?: any;
  onChange?: () => void;
}

interface ProgramOption {
  label: string;
  value: number;
}

interface FacultyOption {
  label: string;
  value: number;
  programs: ProgramOption[];
}

interface UniversityOption {
  label: string;
  value: number;
  faculties: FacultyOption[];
}

const PersonalForm: React.FC<PersonalFormProps> = ({ form, initialData,onChange }) => {
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [loading, setLoading] = useState(false);
    const [universities, setUniversities] = useState<UniversityOption[]>([]);
    const [faculties, setFaculties] = useState<FacultyOption[]>([]);
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [univData] = await Promise.all([
          GetUniversity(),
        ]);

        const univOptions: UniversityOption[] = univData.map((univ: any) => ({
          label: univ.name_th,
          value: univ.ID,
          faculties: (univ.Faculties || []).map((fac: any) => ({
            label: fac.name_th,
            value: fac.ID,
            programs: (fac.Programs || []).map((prog: any) => ({
              label: prog.name_th,
              value: prog.ID,
            })),
          })),
        }));

        setUniversities(univOptions);

        if (initialData) {
          form.setFieldsValue({
            university_id: initialData.University?.ID,
            faculty_id: initialData.Faculty?.ID,
            program_id: initialData.Program?.ID,
          });

          const selectedUniv = univOptions.find((u) => u.value === initialData.University?.ID);
          if (selectedUniv) {
            setFaculties(selectedUniv.faculties);
            
            const selectedFac = selectedUniv.faculties.find((f) => f.value === initialData.Faculty?.ID);
            if (selectedFac) {
              setPrograms(selectedFac.programs);
            }
          }
        }
      } catch (err) {
        console.error("❌ โหลดข้อมูลล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [initialData, form]);


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
  const handleUniversityChange = (univId: number) => {
    form.setFieldsValue({ 
      university_id: univId,
      faculty_id: undefined, 
      program_id: undefined 
    });

    const selectedUniv = universities.find((u) => u.value === univId);
    if (selectedUniv) {
      setFaculties(selectedUniv.faculties);
      setPrograms([]);
    }
    onChange?.();
  };

  const handleFacultyChange = (facultyId: number) => {
    form.setFieldsValue({ 
      faculty_id: facultyId,
      program_id: undefined 
    });

    const selectedFac = faculties.find((f) => f.value === facultyId);
    if (selectedFac) {
      setPrograms(selectedFac.programs);
    }
    onChange?.();
  };
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
                  <Form.Item
            label="ตำแหน่ง"
            name="academic_position"
            rules={[{ required: true, message: "กรุณากรอกตำแหน่ง" }]}
          >
            <Input
              placeholder="กรอกนามสกุล"
              size="large"
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
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
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Form.Item 
            label="มหาวิทยาลัย" 
            name="university_id"
            rules={[{ required: true, message: "กรุณาเลือกมหาวิทยาลัย" }]}
          >
            <Select
              options={universities}
              placeholder="ค้นหาและเลือกมหาวิทยาลัย"
              onChange={handleUniversityChange}
              loading={loading}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          
          <Form.Item 
            label="คณะ" 
            name="faculty_id"
            rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
          >
            <Select
              options={faculties}
              placeholder="เลือกคณะ"
              onChange={handleFacultyChange}
              disabled={!form.getFieldValue("university_id")}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          
          <Form.Item 
            label="สาขาวิชา" 
            name="program_id"
            rules={[{ required: true, message: "กรุณาเลือกสาขาวิชา" }]}
          >
            <Select
              options={programs}
              placeholder="เลือกสาขาวิชา"
              disabled={!form.getFieldValue("faculty_id")}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Space>
      </div>
    </>
  );
};

export default PersonalForm;
