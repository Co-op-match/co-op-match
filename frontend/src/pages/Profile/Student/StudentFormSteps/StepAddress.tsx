import React, { useEffect, useState } from 'react';
import { Form, Input, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd';

export interface StepAddressProps {
  form: FormInstance<any>;
  formData: any;
}

const StepAddress: React.FC<StepAddressProps> = ({ form }) => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [amphures, setAmphures] = useState<any[]>([]);
  const [tambons, setTambons] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json')
      .then(res => res.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  const handleProvinceChange = (provinceName: string) => {
    form.setFieldsValue({ district: undefined, subdistrict: undefined, post_code: undefined });
    setAmphures([]);
    setTambons([]);

    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json')
      .then(res => res.json())
      .then(data => {
        const selectedProvince = provinces.find(p => p.name_th === provinceName);
        const filtered = data.filter((a: any) => a.province_id === selectedProvince?.id);
        setAmphures(filtered);
      });
  };

  const handleAmphureChange = (amphureName: string) => {
    form.setFieldsValue({ subdistrict: undefined, post_code: undefined });
    setTambons([]);

    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json')
      .then(res => res.json())
      .then(data => {
        const selectedAmphure = amphures.find(a => a.name_th === amphureName);
        const filtered = data.filter((t: any) => t.amphure_id === selectedAmphure?.id);
        setTambons(filtered);
      });
  };

const handleTambonChange = (tambonName: string) => {
  const selectedTambon = tambons.find(t => t.name_th === tambonName);
  if (selectedTambon) {
    form.setFieldsValue({ post_code: String(selectedTambon.zip_code) }); // ← ตรงนี้
  }
};


  return (
    <>
      <div className="form-section-title">ข้อมูลที่อยู่</div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="บ้านเลขที่"
            name="house_number"
            rules={[{ required: true, message: 'กรุณากรอกบ้านเลขที่' }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="หมู่บ้าน" name="village">
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="ถนน" name="street">
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="ซอย" name="sub_street">
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="จังหวัด"
            name="province"
            rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}
          >
            <Select placeholder="เลือกจังหวัด" onChange={handleProvinceChange}>
              {provinces.map(p => (
                <Select.Option key={p.id} value={p.name_th}>{p.name_th}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="อำเภอ / เขต"
            name="district"
            rules={[{ required: true, message: 'กรุณาเลือกอำเภอ/เขต' }]}
          >
            <Select
              placeholder="เลือกอำเภอ / เขต"
              disabled={!amphures.length}
              onChange={handleAmphureChange}
            >
              {amphures.map(a => (
                <Select.Option key={a.id} value={a.name_th}>{a.name_th}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ตำบล / แขวง"
            name="subdistrict"
            rules={[{ required: true, message: 'กรุณาเลือกตำบล/แขวง' }]}
          >
            <Select placeholder="เลือกตำบล / แขวง" disabled={!tambons.length} onChange={handleTambonChange}>
              {tambons.map(t => (
                <Select.Option key={t.id} value={t.name_th}>{t.name_th}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="รหัสไปรษณีย์"
            name="post_code"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสไปรษณีย์' },
   
            ]}
          >
            <Input maxLength={5} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepAddress;