import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Radio,
  Upload,
  Avatar,
  Row,
  Col,
  message,
  type FormInstance,
  Select,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  PictureOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { GetAllGender, GetUniversity } from '../../../../../services/https';
import type { GenderInterface } from '../../../../../interfaces/Gender';

export interface StepGeneralInfoProps {
  form: FormInstance<any>;
  formData: any;
  genders: GenderInterface[];
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  documentFile: File | null;
  setDocumentFile: React.Dispatch<React.SetStateAction<File | null>>;
}

// ---------- helpers ----------
type ProgramOption = { label: string; value: number };
type FacultyOption = { label: string; value: number; programs: ProgramOption[] };
type UniversityOption = { label: string; value: number; faculties: FacultyOption[] };

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

const StepAcadamicStaffGeneral: React.FC<StepGeneralInfoProps> = ({
  setImageFile,
  previewUrl,
  setPreviewUrl,
  form,
  documentFile,
  setDocumentFile,
}) => {
  const [genders, setGenders] = useState<GenderInterface[]>([]);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  // watch (เพราะใช้ labelInValue)
  const universityField = Form.useWatch('university_id', form);
  const facultyField = Form.useWatch('faculty_id', form);
  const birthdayWatch = Form.useWatch('birthday', form);

  const universityId = getId(universityField);
  const facultyId = getId(facultyField);

  const prevUniversityId = useRef<number | undefined>(undefined);
  const prevFacultyId = useRef<number | undefined>(undefined);

  // ====== โหลดเพศ ======
  useEffect(() => {
    const fetchGender = async () => {
      try {
        const data = await GetAllGender();
        setGenders(data || []);
      } catch {
        messageApi.error({
          content: 'โหลดข้อมูลเพศไม่สำเร็จ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
      }
    };
    fetchGender();
  }, [messageApi]);

  // ====== โหลดมหาวิทยาลัย ======
  useEffect(() => {
    const load = async () => {
      try {
        const univData = await GetUniversity();
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

        setUniversities(univOptions);
        // กัน "id แวบ" ถ้ามีค่าเดิม
        hydrateLabelInValue(form, 'university_id', univOptions);
      } catch (err) {
        console.error('โหลดข้อมูลมหาวิทยาลัยล้มเหลว:', err);
      }
    };
    load();
  }, [form]);

  // ====== options อนุพันธ์ ======
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

  // hydrate labelInValue สำหรับ fields ที่ตามลำดับ
  useEffect(() => {
    if (universities.length) hydrateLabelInValue(form, 'university_id', universities);
  }, [universities, form]);

  useEffect(() => {
    if (facultyOptions.length) hydrateLabelInValue(form, 'faculty_id', facultyOptions);
  }, [facultyOptions, form]);

  useEffect(() => {
    if (programOptions.length) hydrateLabelInValue(form, 'program_id', programOptions);
  }, [programOptions, form]);

  // เคลียร์ dependent เมื่อเปลี่ยนจริง
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

  // ====== validators ======
  const validateName = (_: any, value?: string) => {
    const v = (value || '').trim();
    if (!v) return Promise.reject('กรุณากรอกชื่อ-นามสกุล');
    if (v.length < 2) return Promise.reject('ต้องมีอย่างน้อย 2 ตัวอักษร');
    if (v.length > 50) return Promise.reject('ต้องไม่เกิน 50 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s]+$/.test(v)) return Promise.reject('ต้องเป็นตัวอักษรไทย/อังกฤษเท่านั้น');
    return Promise.resolve();
  };

  const validateBirthday = (_: any, value: any) => {
    if (!value) return Promise.reject('กรุณาเลือกวันเกิด');
    const today = dayjs();
    const birth = dayjs(value);
    if (birth.isAfter(today)) return Promise.reject('วันเกิดอยู่ในอนาคตไม่ได้');
    const age = today.diff(birth, 'year');
    if (age < 0) return Promise.reject('วันเกิดไม่ถูกต้อง');
    if (age > 120) return Promise.reject('อายุไม่สามารถเกิน 120 ปี');
    return Promise.resolve();
  };

  // อายุจากวันเกิด
  const computeAge = (d?: Dayjs | null) => {
    if (!d) return undefined;
    const birth = dayjs(d);
    const age = dayjs().diff(birth, 'year');
    return age < 0 ? undefined : age;
  };

  const handleBirthdayChange = (date: Dayjs | null) => {
    const age = computeAge(date);
    form.setFieldsValue({ age });
  };

  // sync age เมื่อมีค่า birthday (จาก initial / กลับสเต็ป)
  useEffect(() => {
    const age = computeAge(birthdayWatch);
    form.setFieldsValue({ age: typeof age === 'number' ? age : undefined });
  }, [birthdayWatch, form]);

  // upload รูป
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleBeforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error({
        content: 'สามารถอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น',
        style: { marginTop: '20vh' },
        duration: 3,
      });
      return false;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  // search
  const filterOption = (input: string, option?: any) =>
    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase().trim());

  return (
    <>
      {contextHolder}
      <div className="form-section-title">ข้อมูลทั่วไป</div>

      <div className="student-avatar-upload">
        <Upload showUploadList={false} beforeUpload={handleBeforeUpload} accept="image/*">
          <div className="avatar-upload-container">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="avatar-preview" />
            ) : (
              <Avatar size={120} icon={<UserOutlined />} className="avatar-default" />
            )}
            <div className="avatar-edit-icon">
              <EditOutlined />
            </div>
          </div>
        </Upload>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="gender_id" label="เพศ" rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}>
            <Radio.Group>
              {genders.map((g) => (
                <Radio key={g.ID} value={g.ID}>
                  {g.name}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="academic_position"
            label="ตำแหน่ง"
            rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}
          >
            <Input placeholder="เช่น อาจารย์ / เจ้าหน้าที่ ฯลฯ" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="firstName" label="ชื่อ" rules={[{ validator: validateName }]}>
            <Input placeholder="กรอกชื่อ" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="lastName" label="นามสกุล" rules={[{ validator: validateName }]}>
            <Input placeholder="กรอกนามสกุล" />
          </Form.Item>
        </Col>

        {/* อายุ — คำนวณอัตโนมัติจากวันเกิด */}
        <Col span={12}>
          <Form.Item
            name="age"
            label="อายุ"
            rules={[{ required: true, message: 'กรุณาเลือกวันเกิดเพื่อคำนวณอายุ' }]}
          >
            <Input type="number" placeholder="อายุจะคำนวณอัตโนมัติ" disabled />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="birthday" label="วันเกิด" rules={[{ validator: validateBirthday }]}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="เลือกวันเกิด"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
              showToday={false}
              onChange={handleBirthdayChange}
            />
          </Form.Item>
        </Col>

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
              options={universities}
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              allowClear
              onChange={() => {
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
              options={facultyOptions}
              disabled={!universityId}
              optionLabelProp="label"
              optionFilterProp="label"
              showSearch
              filterOption={filterOption}
              allowClear
              onChange={() => form.setFieldsValue({ program_id: undefined })}
              onClear={() => form.setFieldsValue({ faculty_id: undefined, program_id: undefined })}
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
              options={programOptions}
              disabled={!facultyId}
              optionLabelProp="label"
              optionFilterProp="label"
              showSearch
              filterOption={filterOption}
              allowClear
            />
          </Form.Item>
        </Col>

        {/* อัปโหลดไฟล์ยืนยัน */}
        <Col span={12}>
          <Form.Item label="ไฟล์ยืนยัน (PDF หรือ รูปภาพ)" required>
            <Upload
              showUploadList={false}
              beforeUpload={(file: File) => {
                const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
                if (!isValidType) {
                  messageApi.error({
                    content: 'รองรับเฉพาะไฟล์ PDF หรือ รูปภาพ',
                    style: { marginTop: '20vh' },
                    duration: 3,
                  });
                  return false;
                }
                setDocumentFile(file);
                return false;
              }}
              accept=".pdf,image/*"
            >
              <div className="document-upload-button">
                <PaperClipOutlined />
                {documentFile ? 'เปลี่ยนไฟล์ยืนยัน' : 'คลิกเพื่ออัปโหลดไฟล์ยืนยัน'}
              </div>
            </Upload>

            {documentFile && (
              <div className="uploaded-file-wrapper">
                <Tooltip title={documentFile.name}>
                  <div className="uploaded-file-tag">
                    {documentFile.type.startsWith('image/') ? (
                      <PictureOutlined className="uploaded-file-icon" />
                    ) : (
                      <FileTextOutlined className="uploaded-file-icon" />
                    )}
                    <span className="uploaded-file-name">
                      {documentFile.name.length > 30 ? documentFile.name.slice(0, 27) + '...' : documentFile.name}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepAcadamicStaffGeneral;
