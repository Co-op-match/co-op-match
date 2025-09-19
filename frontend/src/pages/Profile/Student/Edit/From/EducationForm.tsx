import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Divider, Space } from "antd";
import {  BankOutlined, ReadOutlined, TrophyOutlined } from "@ant-design/icons";
import { GetAllEducationLevel, GetUniversity } from "../../../../../services/https";

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

interface EducationFormProps {
  form: any;
  initialData?: any;
  onChange?: () => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ form, initialData, onChange }) => {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [educationLevels, setEducationLevels] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [univData, levelData] = await Promise.all([
          GetUniversity(),
          GetAllEducationLevel()
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

        const levelOptions = levelData.map((level: any) => ({
          label: level.name,
          value: level.ID,
        }));

        setUniversities(univOptions);
        setEducationLevels(levelOptions);

        const init = initialData?.Education?.[0];
        if (init) {
          form.setFieldsValue({
            grade: init.grade,
            education_level_id: init.EducationLevel?.ID,
            university_id: init.University?.ID,
            faculty_id: init.Faculty?.ID,
            program_id: init.Program?.ID,
            year: init.year,
          });

          const selectedUniv = univOptions.find((u) => u.value === init.University?.ID);
          if (selectedUniv) {
            setFaculties(selectedUniv.faculties);
            
            const selectedFac = selectedUniv.faculties.find((f) => f.value === init.Faculty?.ID);
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

  return (
    <>
      {/* Academic Performance Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ 
          color: "#262626", 
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <TrophyOutlined style={{  color: "#1890ff" }} />
          ผลการเรียน
        </h4>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "2fr 1fr", 
          gap: "16px" 
        }}>
          <Form.Item 
            label="เกรดเฉลี่ย (GPAX)" 
            name="grade"
            rules={[
              { pattern: /^\d+(\.\d{1,2})?$/, message: "กรุณากรอกเกรดที่ถูกต้อง เช่น 3.50" }
            ]}
          >
            <Input 
              placeholder="เช่น 3.50" 
              size="large"
              suffix={<span style={{ color: "#bfbfbf" }}>/ 4.00</span>}
            />
          </Form.Item>
          
          <Form.Item 
            label="ชั้นปี" 
            name="year"
            rules={[{ required: true, message: "กรุณากรอกชั้นปี" }]}
          >
            <InputNumber 
              style={{ width: "100%" }}
              min={1}
              max={8}
              placeholder="ปี"
              size="large"
            />
          </Form.Item>
        </div>
      </div>

      <Divider />

      {/* Education Level Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ 
          color: "#262626", 
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <ReadOutlined style={{ color: "#52c41a" }} />
          ระดับการศึกษา
        </h4>
        
        <Form.Item 
          label="ระดับการศึกษา" 
          name="education_level_id"
          rules={[{ required: true, message: "กรุณาเลือกระดับการศึกษา" }]}
        >
          <Select 
            options={educationLevels} 
            placeholder="เลือกระดับการศึกษา"
            loading={loading}
            size="large"
          />
        </Form.Item>
      </div>

      <Divider />

      {/* Institution Section */}
      <div>
        <h4 style={{ 
          color: "#262626", 
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <BankOutlined style={{ color: "#52c41a" }} />
          สถาบันการศึกษา
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

export default EducationForm;