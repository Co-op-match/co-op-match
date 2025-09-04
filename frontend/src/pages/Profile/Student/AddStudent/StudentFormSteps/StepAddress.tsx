import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Row, Col, Select, message } from 'antd';
import type { FormInstance } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { GetAllProvinces } from '../../../../../services/https';

export interface StepAddressProps {
  form: FormInstance<any>;
  formData: any;
}

type SelectOption = { label: string; value: number };

// ------- helpers -------
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

const StepAddress: React.FC<StepAddressProps> = ({ form }) => {
  // raw data จาก API
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  // watch ค่าฟอร์ม (เพราะใช้ labelInValue)
  const provinceField = Form.useWatch('province', form);
  const districtField = Form.useWatch('district', form);
  const subdistrictField = Form.useWatch('subdistrict_id', form);

  const provinceId = getId(provinceField);
  const districtId = getId(districtField);
  const subdistrictId = getId(subdistrictField);

  // โหลดข้อมูลจังหวัด (ครั้งเดียว)
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        const res = await GetAllProvinces();
        const data = (res as any).data || res;

        if (!Array.isArray(data)) throw new Error('ข้อมูลจังหวัดไม่ถูกต้อง');
        // map เป็นตัวเลขเสมอ
        const normalized = data.map((p: any) => ({
          ...p,
          ID: Number(p.ID),
          Districts: (p.Districts || []).map((d: any) => ({
            ...d,
            ID: Number(d.ID),
            SubDistricts: (d.SubDistricts || []).map((s: any) => ({
              ...s,
              ID: Number(s.ID),
              Postcode: s.Postcode
                ? { ...s.Postcode, ID: Number(s.Postcode.ID) }
                : undefined,
            })),
          })),
        }));

        setRawProvinces(normalized);
      } catch (error) {
        console.error('โหลดจังหวัดล้มเหลว:', error);
        messageApi.error({
          content: 'โหลดข้อมูลที่อยู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
          style: { marginTop: '20vh' },
          duration: 3,
        });
      } finally {
        setLoading(false);
      }
    };
    loadProvinces();
  }, [messageApi]);

  // ---------- อนุพันธ์ options/objects ด้วย useMemo ----------
  const provinceOptions: SelectOption[] = useMemo(
    () =>
      rawProvinces.map((p) => ({
        label: p.name_th || p.name || 'ไม่ระบุชื่อ',
        value: p.ID,
      })),
    [rawProvinces]
  );

  const selectedProvince = useMemo(
    () => rawProvinces.find((p) => p.ID === provinceId),
    [rawProvinces, provinceId]
  );

  const districtOptions: SelectOption[] = useMemo(() => {
    if (!selectedProvince) return [];
    return (selectedProvince.Districts || []).map((d: any) => ({
      label: d.name_th || d.name || 'ไม่ระบุชื่อ',
      value: d.ID,
    }));
  }, [selectedProvince]);

  const selectedDistrict = useMemo(() => {
    if (!selectedProvince || !districtId) return undefined;
    return (selectedProvince.Districts || []).find((d: any) => d.ID === districtId);
  }, [selectedProvince, districtId]);

  const subdistrictOptions: SelectOption[] = useMemo(() => {
    if (!selectedDistrict) return [];
    return (selectedDistrict.SubDistricts || []).map((s: any) => ({
      label: s.name_th || s.name || 'ไม่ระบุชื่อ',
      value: s.ID,
    }));
  }, [selectedDistrict]);

  const selectedSubdistrict = useMemo(() => {
    if (!selectedDistrict || !subdistrictId) return undefined;
    return (selectedDistrict.SubDistricts || []).find((s: any) => s.ID === subdistrictId);
  }, [selectedDistrict, subdistrictId]);

  const postcodeOption: SelectOption[] = useMemo(() => {
    const pc = selectedSubdistrict?.Postcode;
    return pc ? [{ label: pc.post_code, value: pc.ID }] : [];
  }, [selectedSubdistrict]);

  // ---------- Hydrate กัน id แว้บ ----------
  useEffect(() => {
    if (!loading) hydrateLabelInValue(form, 'province', provinceOptions);
  }, [loading, provinceOptions, form]);

  useEffect(() => {
    hydrateLabelInValue(form, 'district', districtOptions);
  }, [districtOptions, form]);

  useEffect(() => {
    hydrateLabelInValue(form, 'subdistrict_id', subdistrictOptions);
  }, [subdistrictOptions, form]);

  useEffect(() => {
    hydrateLabelInValue(form, 'post_code', postcodeOption);
  }, [postcodeOption, form]);

  // ---------- Validators (รองรับ labelInValue) ----------
  const validateHouseNumber = (_: any, value: string) => {
    if (!value || value.trim() === '') return Promise.reject('กรุณากรอกบ้านเลขที่');
    const t = value.trim();
    if (t.length > 20) return Promise.reject('บ้านเลขที่ต้องไม่เกิน 20 ตัวอักษร');
    if (!/^[0-9a-zA-Zก-๙\s\-\/]+$/.test(t)) return Promise.reject('บ้านเลขที่สามารถมีตัวเลข ตัวอักษร เครื่องหมาย - และ / เท่านั้น');
    return Promise.resolve();
  };

  const validateVillage = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const t = value.trim();
    if (t.length > 50) return Promise.reject('ชื่อหมู่บ้านต้องไม่เกิน 50 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s\-\.0-9]+$/.test(t)) return Promise.reject('ชื่อหมู่บ้านมีรูปแบบไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateStreet = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const t = value.trim();
    if (t.length > 100) return Promise.reject('ชื่อถนนต้องไม่เกิน 100 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s\-\.0-9]+$/.test(t)) return Promise.reject('ชื่อถนนมีรูปแบบไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateSubStreet = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const t = value.trim();
    if (t.length > 100) return Promise.reject('ชื่อซอยต้องไม่เกิน 100 ตัวอักษร');
    if (!/^[a-zA-Zก-๙\s\-\.0-9]+$/.test(t)) return Promise.reject('ชื่อซอยมีรูปแบบไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateProvince = (_: any, value: any) => {
    const id = getId(value);
    if (!id) return Promise.reject('กรุณาเลือกจังหวัด');
    if (!provinceOptions.some((p) => p.value === id)) return Promise.reject('จังหวัดที่เลือกไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateDistrict = (_: any, value: any) => {
    const id = getId(value);
    if (!id) return Promise.reject('กรุณาเลือกอำเภอ/เขต');
    if (!provinceId) return Promise.reject('กรุณาเลือกจังหวัดก่อน');
    if (!districtOptions.some((d) => d.value === id)) return Promise.reject('อำเภอ/เขตที่เลือกไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validateSubdistrict = (_: any, value: any) => {
    const id = getId(value);
    if (!id) return Promise.reject('กรุณาเลือกตำบล/แขวง');
    if (!districtId) return Promise.reject('กรุณาเลือกอำเภอ/เขตก่อน');
    if (!subdistrictOptions.some((s) => s.value === id)) return Promise.reject('ตำบล/แขวงที่เลือกไม่ถูกต้อง');
    return Promise.resolve();
  };

  const validatePostCode = (_: any, value: any) => {
    const id = getId(value);
    if (!id) return Promise.reject('กรุณาเลือกรหัสไปรษณีย์');
    const pc = selectedSubdistrict?.Postcode?.ID;
    if (!pc) return Promise.reject('กรุณาเลือกตำบล/แขวงก่อน');
    if (pc !== id) return Promise.reject('รหัสไปรษณีย์ไม่ตรงกับตำบล/แขวงที่เลือก');
    return Promise.resolve();
  };

  // ---------- search helper ----------
  const filterOption = (input: string, option?: DefaultOptionType) => {
    const s = input.toLowerCase().trim();
    const lbl = String(option?.label ?? '').toLowerCase();
    return lbl.includes(s);
  };

  return (
    <>
      {contextHolder}
      <div className="form-section-title">ข้อมูลที่อยู่</div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="บ้านเลขที่"
            name="house_number"
            rules={[{ required: true, message: 'กรุณากรอกบ้านเลขที่' }, { validator: validateHouseNumber }]}
          >
            <Input placeholder="กรอกบ้านเลขที่" maxLength={20} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="หมู่บ้าน" name="village" rules={[{ validator: validateVillage }]}>
            <Input placeholder="กรอกชื่อหมู่บ้าน (ถ้ามี)" maxLength={50} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="ถนน" name="street" rules={[{ validator: validateStreet }]}>
            <Input placeholder="กรอกชื่อถนน (ถ้ามี)" maxLength={100} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="ซอย" name="sub_street" rules={[{ validator: validateSubStreet }]}>
            <Input placeholder="กรอกชื่อซอย (ถ้ามี)" maxLength={100} />
          </Form.Item>
        </Col>

        {/* จังหวัด */}
        <Col span={12}>
          <Form.Item
            label="จังหวัด"
            name="province"
            rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }, { validator: validateProvince }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              showSearch
              options={provinceOptions}
              placeholder="เลือกจังหวัด"
              loading={loading}
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              notFoundContent={loading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}
              allowClear
              onChange={() => {
                // เคลียร์ dependents
                form.setFieldsValue({ district: undefined, subdistrict_id: undefined, post_code: undefined });
              }}
              onClear={() => {
                form.setFieldsValue({ province: undefined, district: undefined, subdistrict_id: undefined, post_code: undefined });
              }}
            />
          </Form.Item>
        </Col>

        {/* อำเภอ / เขต */}
        <Col span={12}>
          <Form.Item
            label="อำเภอ / เขต"
            name="district"
            rules={[{ required: true, message: 'กรุณาเลือกอำเภอ/เขต' }, { validator: validateDistrict }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              showSearch
              options={districtOptions}
              placeholder={provinceId ? 'เลือกอำเภอ / เขต' : 'เลือกจังหวัดก่อน'}
              disabled={!provinceId || districtOptions.length === 0}
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              notFoundContent={provinceId ? 'ไม่พบข้อมูลอำเภอ/เขต' : 'กรุณาเลือกจังหวัดก่อน'}
              allowClear
              onChange={() => {
                form.setFieldsValue({ subdistrict_id: undefined, post_code: undefined });
              }}
              onClear={() => {
                form.setFieldsValue({ district: undefined, subdistrict_id: undefined, post_code: undefined });
              }}
            />
          </Form.Item>
        </Col>

        {/* ตำบล / แขวง */}
        <Col span={12}>
          <Form.Item
            label="ตำบล / แขวง"
            name="subdistrict_id"
            rules={[{ required: true, message: 'กรุณาเลือกตำบล/แขวง' }, { validator: validateSubdistrict }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              showSearch
              options={subdistrictOptions}
              placeholder={districtId ? 'เลือกตำบล / แขวง' : 'เลือกอำเภอ/เขตก่อน'}
              disabled={!districtId || subdistrictOptions.length === 0}
              optionLabelProp="label"
              optionFilterProp="label"
              filterOption={filterOption}
              notFoundContent={districtId ? 'ไม่พบข้อมูลตำบล/แขวง' : 'กรุณาเลือกอำเภอ/เขตก่อน'}
              allowClear
              onChange={() => {
                form.setFieldsValue({ post_code: undefined });
              }}
              onClear={() => {
                form.setFieldsValue({ subdistrict_id: undefined, post_code: undefined });
              }}
            />
          </Form.Item>
        </Col>

        {/* รหัสไปรษณีย์ */}
        <Col span={12}>
          <Form.Item
            label="รหัสไปรษณีย์"
            name="post_code"
            rules={[{ required: true, message: 'กรุณาเลือกรหัสไปรษณีย์' }, { validator: validatePostCode }]}
            normalize={(v) => v}
          >
            <Select
              labelInValue
              disabled={!selectedSubdistrict?.Postcode}
              options={postcodeOption}
              placeholder={selectedSubdistrict ? 'เลือกรหัสไปรษณีย์' : 'เลือกตำบล/แขวงก่อน'}
              optionLabelProp="label"
              optionFilterProp="label"
              notFoundContent={selectedSubdistrict ? 'ไม่พบรหัสไปรษณีย์' : 'กรุณาเลือกตำบล/แขวงก่อน'}
              allowClear
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepAddress;
