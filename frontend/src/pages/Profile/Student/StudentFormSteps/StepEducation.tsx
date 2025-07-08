import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd';
import { GetAllEducationLevel, GetUniversity } from '../../../../services/https';

export interface StepEducationProps {
  form: FormInstance<any>;
  formData: any;
}

const StepEducation: React.FC<StepEducationProps> = ({ form }) => {
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<number>();
  const [selectedFaculty, setSelectedFaculty] = useState<number>();
  const [selectededucationLevels, setSelectededucationLevels] = useState<number>();
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const load = async () => {
      try {
        const univData = await GetUniversity();
        const levelData = await GetAllEducationLevel();

        const univOptions = univData.map((univ: any) => ({
          label: univ.name_th,
          value: univ.ID,
          faculties: univ.Faculties || [],
        }));

        const levelOptions = levelData.map((level: any) => ({
          label: level.name,
          value: Number(level.ID),
        }));
        setUniversities(univOptions);
        setEducationLevels(levelOptions);
      } catch (err) {
        console.error("โหลดข้อมูลล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

useEffect(() => {
  const universityId = form.getFieldValue("university_id");
  const facultyId = form.getFieldValue("faculty_id");

  if (!universityId || universities.length === 0) return;

  setSelectedUniversity(universityId);

  const selectedUniv = universities.find((u) => u.value === universityId);
  const facOptions = (selectedUniv?.faculties || []).map((f: any) => ({
    label: f.name_th,
    value: f.ID,
    programs: f.Programs || [],
  }));

  setFaculties(facOptions);

  if (facultyId) {
    setSelectedFaculty(facultyId);
    const selectedFac = facOptions.find((f: { value: any; }) => f.value === facultyId);
    const progOptions = (selectedFac?.programs || []).map((p: any) => ({
      label: p.name_th,
      value: p.ID,
    }));
    setPrograms(progOptions);
  }

  const eduLevelId = form.getFieldValue("education_level_id");
  if (eduLevelId) {
    setSelectededucationLevels(eduLevelId);
  }
}, [universities]);

  const handleUniversityChange = (univId: number) => {
    setSelectedUniversity(univId);
    form.setFieldValue("university_id", univId);
    const selectedUniv = universities.find((u) => u.value === univId);
    const facOptions = (selectedUniv?.faculties || []).map((f: any) => ({
      label: f.name_th,
      value: f.ID,
      programs: f.Programs || [],
    }));
    setFaculties(facOptions);
    setPrograms([]);
    setSelectedFaculty(undefined);
    form.setFieldsValue({ faculty_id: undefined, program_id: undefined });
  };

  const handleFacultyChange = (facultyId: number) => {
    setSelectedFaculty(facultyId);
    form.setFieldValue("faculty_id", facultyId);
    const selectedFac = faculties.find((f) => f.value === facultyId);
    const progOptions = (selectedFac?.programs || []).map((p: any) => ({
      label: p.name_th,
      value: p.ID,
    }));
    setPrograms(progOptions);
    form.setFieldValue("program_id", undefined);
  };

  return (
    <>
      <div className="form-section-title">ข้อมูลการศึกษา</div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="มหาวิทยาลัย"
            name="university_id"
            rules={[{ required: true, message: 'กรุณาเลือกมหาวิทยาลัย' }]}
          >
            <Select
              showSearch
              placeholder="เลือกมหาวิทยาลัย"
              loading={loading}
              options={universities}
              onChange={handleUniversityChange}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="คณะ"
            name="faculty_id"
            rules={[{ required: true, message: 'กรุณาเลือกคณะ' }]}
          >
            <Select
              placeholder="เลือกคณะ"
              options={faculties}
              disabled={!selectedUniversity}
              onChange={handleFacultyChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="สาขา"
            name="program_id"
            rules={[{ required: true, message: 'กรุณาเลือกสาขา' }]}
          >
            <Select
              placeholder="เลือกสาขา"
              options={programs}
              disabled={!selectedFaculty}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={12}>
        <Form.Item
          label="ระดับการศึกษา"
          name="education_level_id"
          rules={[{ required: true, message: 'กรุณาเลือกระดับการศึกษา' }]}
        >
          <Select
            placeholder="เลือกระดับการศึกษา"
            options={educationLevels}
            value={selectededucationLevels} // ✅ เชื่อมตรงนี้
            onChange={(value: number) => {
              setSelectededucationLevels(value);
              form.setFieldValue("education_level_id", value);
            }}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
          />
              </Form.Item>
            </Col>
        <Col span={12}>
          <Form.Item
            label="ชั้นปี"
            name="year"
            rules={[{ required: true, message: 'กรุณากรอกชั้นปี' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="ชั้นปี" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="เกรดเฉลี่ย (GPAX)"
            name="grade"
            rules={[
              { required: true, message: 'กรุณากรอกเกรดเฉลี่ย' },
              {
                type: 'number',
                min: 0,
                max: 4,
                message: 'เกรดต้องอยู่ระหว่าง 0 - 4.00',
              },
            ]}
          >
            <InputNumber step={0.01} style={{ width: '100%' }} placeholder="เช่น 3.25" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepEducation;
