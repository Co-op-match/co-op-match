import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, InputNumber, Row, Col, Select, message } from 'antd';
import type { FormInstance } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { GetAllEducationLevel, GetUniversity } from '../../../../../services/https';

export interface StepEducationProps {
  form: FormInstance<any>;
  formData: any;
}

type ProgramOption = { label: string; value: number };
type FacultyOption = { label: string; value: number; programs: ProgramOption[] };
type UniversityOption = { label: string; value: number; faculties: FacultyOption[] };
type LevelOption = { label: string; value: number };

// -------- helpers --------
const getId = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'value' in (v as any)) {
    const val = (v as any).value;
    return typeof val === 'number' ? val : Number(val);
  }
  const n = Number(v as any);
  return Number.isNaN(n) ? undefined : n;
};

const hydrateLabelInValue = (
  form: FormInstance,
  field: string,
  options: { value: number; label: string }[]
) => {
  const raw = form.getFieldValue(field);
  const id = getId(raw);
  if (!id || options.length === 0) return;
  const found = options.find((o) => o.value === id);
  if (!found) return;
  if (!(raw && typeof raw === 'object' && 'value' in raw)) {
    form.setFieldsValue({ [field]: { value: found.value, label: found.label } });
  }
};

const StepEducation: React.FC<StepEducationProps> = ({ form }) => {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [educationLevels, setEducationLevels] = useState<LevelOption[]>([]);
  const [formReady, setFormReady] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // watch form (เพราะใช้ labelInValue)
  const universityField = Form.useWatch('university_id', form);
  const facultyField = Form.useWatch('faculty_id', form);
  const universityId = getId(universityField);
  const facultyId = getId(facultyField);

  const prevUniversityId = useRef<number | undefined>(undefined);
  const prevFacultyId = useRef<number | undefined>(undefined);

  // -------- load data (เหมือนโค้ดเดิม) --------
  useEffect(() => {
    const load = async () => {
      try {
        const [univData, levelData] = await Promise.all([GetUniversity(), GetAllEducationLevel()]);

        const univOptions: UniversityOption[] = (univData || []).map((univ: any) => ({
          label: univ.name_th ?? univ.name ?? 'ไม่ระบุชื่อ',
          value: Number(univ.ID),
          faculties: (univ.Faculties || []).map((f: any) => ({
            label: f.name_th ?? f.name ?? 'ไม่ระบุชื่อ',
            value: Number(f.ID),
            programs: (f.Programs || []).map((p: any) => ({
              label: p.name_th ?? p.name ?? 'ไม่ระบุชื่อ',
              value: Number(p.ID),
            })),
          })),
        }));

        const levelOptions: LevelOption[] = (levelData || []).map((level: any) => ({
          label: level.name ?? 'ไม่ระบุชื่อ',
          value: Number(level.ID),
        }));

        setUniversities(univOptions);
        setEducationLevels(levelOptions);

        // hydrate ทันที กัน id แว้บ
        hydrateLabelInValue(form, 'university_id', univOptions);
        hydrateLabelInValue(form, 'education_level_id', levelOptions);
        
        // Initialize form ready state after data is loaded
        Promise.resolve().then(() => {
          setFormReady(true);
        });
      } catch (e) {
        console.error(e);
        messageApi.error('โหลดข้อมูลการศึกษาไม่สำเร็จ');
      }
    };
    load();
  }, [form, messageApi]);

  // -------- derive options แบบ useMemo (ไม่ใช้ state เพื่อกัน race) --------
  const facultyOptions: FacultyOption[] = useMemo(() => {
    if (!universityId) return [];
    const u = universities.find((x) => x.value === universityId);
    return u?.faculties ?? [];
  }, [universities, universityId]);

  const programOptions: ProgramOption[] = useMemo(() => {
    if (!facultyId) return [];
    const f = facultyOptions.find((x) => x.value === facultyId);
    return f?.programs ?? [];
  }, [facultyOptions, facultyId]);

  // -------- hydrate ตามลำดับ เมื่อ options พร้อม --------
  useEffect(() => {
    if (!universities.length) return;
    hydrateLabelInValue(form, 'university_id', universities);
  }, [universities, form]);

  useEffect(() => {
    if (!facultyOptions.length) return;
    hydrateLabelInValue(form, 'faculty_id', facultyOptions);
  }, [facultyOptions, form]);

  useEffect(() => {
    if (!programOptions.length) return;
    hydrateLabelInValue(form, 'program_id', programOptions);
  }, [programOptions, form]);

  // -------- sync เมื่อผู้ใช้เปลี่ยน --------
  // มหาวิทยาลัยเปลี่ยน → เคลียร์คณะ/สาขา
  useEffect(() => {
    if (prevUniversityId.current === undefined) {
      prevUniversityId.current = universityId;
      return;
    }
    if (prevUniversityId.current !== universityId) {
      form.setFieldsValue({ faculty_id: undefined, program_id: undefined });
      prevUniversityId.current = universityId;
    }
  }, [universityId, form]);

  // คณะเปลี่ยน → เคลียร์สาขา (ถ้าไม่อยู่ในตัวเลือก)
  useEffect(() => {
    if (prevFacultyId.current === undefined) {
      prevFacultyId.current = facultyId;
      return;
    }
    if (prevFacultyId.current !== facultyId) {
      form.setFieldsValue({ program_id: undefined });
      prevFacultyId.current = facultyId;
    } else {
      const pid = getId(form.getFieldValue('program_id'));
      if (pid && !programOptions.some((p) => p.value === pid)) {
        form.setFieldsValue({ program_id: undefined });
      }
    }
  }, [facultyId, programOptions, form]);

  // -------- validators (ถ้าต้องการเข้มกว่านี้บอกได้) --------
  const validateYear = (_: any, value: any) => {
    if (value === null || value === undefined || value === '') return Promise.reject('กรุณากรอกชั้นปี');
    const n = typeof value === 'string' ? parseInt(value, 10) : value;
    if (Number.isNaN(n)) return Promise.reject('ชั้นปีต้องเป็นตัวเลข');
    if (!Number.isInteger(n)) return Promise.reject('ชั้นปีต้องเป็นจำนวนเต็ม');
    if (n < 1 || n > 10) return Promise.reject('ชั้นปีต้องอยู่ระหว่าง 1-10');
    return Promise.resolve();
  };
  const validateGrade = (_: any, value: any) => {
    if (value === null || value === undefined || value === '') return Promise.reject('กรุณากรอกเกรดเฉลี่ย');
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(n)) return Promise.reject('เกรดต้องเป็นตัวเลข');
    if (n < 0 || n > 4) return Promise.reject('เกรดต้องอยู่ระหว่าง 0.00-4.00');
    const s = String(value);
    const dp = s.includes('.') ? s.split('.')[1].length : 0;
    if (dp > 2) return Promise.reject('เกรดสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง');
    return Promise.resolve();
  };

  const filterOption = (input: string, option?: DefaultOptionType) => {
    const s = input.toLowerCase().trim();
    const label = String(option?.label ?? '').toLowerCase();
    return label.includes(s);
  };

  return (
    <>
      {contextHolder}
      <div className="form-section-title">ข้อมูลการศึกษา</div>
      <Row gutter={16}>
        {/* มหาวิทยาลัย */}
        <Col span={12}>
          <Form.Item
            label="มหาวิทยาลัย"
            name="university_id"
            rules={[{ required: true, message: 'กรุณาเลือกมหาวิทยาลัย' }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              showSearch
              placeholder="เลือกมหาวิทยาลัย"
              loading={!formReady}
              disabled={!formReady}
              options={formReady ? universities : []}
              fieldNames={{ label: 'label', value: 'value' }}
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              allowClear
              onChange={() => {
                // เคลียร์ dependents ทันที (กันค่าค้าง)
                form.setFieldsValue({ faculty_id: undefined, program_id: undefined });
              }}
              onClear={() => {
                form.setFieldsValue({ university_id: undefined, faculty_id: undefined, program_id: undefined });
              }}
            />
          </Form.Item>
        </Col>

        {/* คณะ */}
        <Col span={12}>
          <Form.Item
            label="คณะ"
            name="faculty_id"
            rules={[{ required: true, message: 'กรุณาเลือกคณะ' }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              placeholder={universityId ? 'เลือกคณะ' : 'เลือกมหาวิทยาลัยก่อน'}
              options={formReady ? facultyOptions : []}
              fieldNames={{ label: 'label', value: 'value' }}
              disabled={!formReady || !universityId}
              loading={!formReady}
              optionLabelProp="label"
              optionFilterProp="label"
              showSearch
              filterOption={filterOption}
              allowClear
              onChange={() => {
                // เคลียร์สาขาทันที
                form.setFieldsValue({ program_id: undefined });
              }}
              onClear={() => {
                form.setFieldsValue({ faculty_id: undefined, program_id: undefined });
              }}
            />
          </Form.Item>
        </Col>

        {/* สาขา */}
        <Col span={12}>
          <Form.Item
            label="สาขา"
            name="program_id"
            rules={[{ required: true, message: 'กรุณาเลือกสาขา' }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              placeholder={facultyId ? 'เลือกสาขา' : 'เลือกคณะก่อน'}
              options={formReady ? programOptions : []}
              fieldNames={{ label: 'label', value: 'value' }}
              disabled={!formReady || !facultyId}
              loading={!formReady}
              optionLabelProp="label"
              optionFilterProp="label"
              showSearch
              filterOption={filterOption}
              allowClear
            />
          </Form.Item>
        </Col>

        {/* ระดับการศึกษา */}
        <Col span={12}>
          <Form.Item
            label="ระดับการศึกษา"
            name="education_level_id"
            rules={[{ required: true, message: 'กรุณาเลือกระดับการศึกษา' }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              placeholder="เลือกระดับการศึกษา"
              options={formReady ? educationLevels : []}
              fieldNames={{ label: 'label', value: 'value' }}
              disabled={!formReady}
              loading={!formReady}
              showSearch
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              allowClear
            />
          </Form.Item>
        </Col>

        {/* ชั้นปี */}
        <Col span={12}>
          <Form.Item
            label="ชั้นปี"
            name="year"
            rules={[{ required: true, message: 'กรุณากรอกชั้นปี' }, { validator: validateYear }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="ชั้นปี" />
          </Form.Item>
        </Col>

        {/* เกรดเฉลี่ย */}
        <Col span={12}>
          <Form.Item
            label="เกรดเฉลี่ย (GPAX)"
            name="grade"
            rules={[{ required: true, message: 'กรุณากรอกเกรดเฉลี่ย' }, { validator: validateGrade }]}
          >
            <InputNumber
              min={0}
              max={4}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="เช่น 3.25"
              parser={(v) => {
                if (!v) return NaN;
                const n = parseFloat(v.replace(/[^\d.]/g, ''));
                return Number.isNaN(n) ? NaN : n;
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepEducation;
