import React, { useEffect, useState } from 'react';
import { Form, Input, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd';
import { GetAllProvinces } from '../../../../../services/https';

export interface StepAddressProps {
  form: FormInstance<any>;
  formData: any;
}

interface SelectOption {
  label: string;
  value: number;
}

const StepAddress: React.FC<StepAddressProps> = ({ form }) => {
  const [provinceOptions, setProvinceOptions] = useState<SelectOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<SelectOption[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<SelectOption[]>([]);

  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>();
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>();
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await GetAllProvinces();
        const data = res.data || res;
        setRawProvinces(data);
        console.log("✅ data:", data);
        setProvinceOptions(
          data.map((p: any) => ({
            label: p.name_th,
            value: Number(p.ID),
          }))
        );
      } catch (error) {
        console.error('โหลดจังหวัดล้มเหลว:', error);
      }
    };

    loadProvinces();
  }, []);
  useEffect(() => {
  const provinceId = form.getFieldValue("province");
  const districtId = form.getFieldValue("district");
  const subdistrictId = form.getFieldValue("subdistrict_id");

  if (!provinceId || !rawProvinces.length) return;

  const selectedProvince = rawProvinces.find((p) => Number(p.ID) === provinceId);
  if (!selectedProvince) return;

  setSelectedProvinceId(provinceId);

  const districts = selectedProvince?.Districts || [];
  const mappedDistricts = districts.map((d: any) => ({
    label: d.name_th,
    value: Number(d.ID),
  }));
  setDistrictOptions(mappedDistricts);

  if (districtId) {
    setSelectedDistrictId(districtId);
    const selectedDistrict = districts.find((d: any) => Number(d.ID) === districtId);
    const subdistricts = selectedDistrict?.SubDistricts || [];

    const mappedSubdistricts = subdistricts.map((s: any) => ({
      label: s.name_th,
      value: Number(s.ID),
    }));
    setSubdistrictOptions(mappedSubdistricts);

    if (subdistrictId) {
      const selectedSub = subdistricts.find((s: any) => Number(s.ID) === subdistrictId);
      if (selectedSub) {
        setSelectedSubdistrict(selectedSub);
      }
    }
  }
}, [rawProvinces]);

  const handleProvinceChange = (provinceId: number) => {
  console.log("✅ เลือกจังหวัด ID:", provinceId);
  form.setFieldsValue({
    province: provinceId,
    district: undefined,
    subdistrict: undefined,
    post_code: undefined,
  });

  setSelectedProvinceId(provinceId);
  setSelectedDistrictId(undefined);
  setDistrictOptions([]);
  setSubdistrictOptions([]);

  const selectedProvince = rawProvinces.find((p) => Number(p.ID) === provinceId);
  console.log("📌 ข้อมูลจังหวัดที่เลือก:", selectedProvince);
  console.log("📌 Districts:", selectedProvince?.Districts);

  if (Array.isArray(selectedProvince?.Districts)) {
    setDistrictOptions(
      selectedProvince.Districts.map((d: any) => ({
        label: d.name_th,
        value: Number(d.ID),
      }))
    );
  }
};

const handleDistrictChange = (districtId: number) => {
  console.log("✅ เลือกอำเภอ ID:", districtId);
  form.setFieldsValue({
    district: districtId,
    subdistrict: undefined,
    post_code: undefined,
  });

  setSelectedDistrictId(districtId);
  setSubdistrictOptions([]);

  const selectedProvince = rawProvinces.find((p) => Number(p.ID) === selectedProvinceId);
  const selectedDistrict = selectedProvince?.Districts?.find((d: any) => Number(d.ID) === districtId);

  console.log("📌 selectedDistrict:", selectedDistrict);
  console.log("📌 SubDistricts:", selectedDistrict?.SubDistricts);

  if (Array.isArray(selectedDistrict?.SubDistricts)) {
    setSubdistrictOptions(
      selectedDistrict.SubDistricts.map((s: any) => ({
        label: s.name_th,
        value: Number(s.ID),
      }))
    );
  }
};

const handleSubdistrictChange = (subdistrictId: number) => {
  console.log("✅ เลือกตำบล ID:", subdistrictId);

  const selectedProvince = rawProvinces.find((p) => Number(p.ID) === selectedProvinceId);
  const selectedDistrict = selectedProvince?.Districts?.find((d: any) => d.ID === selectedDistrictId);
  const selectedSubdistrict = selectedDistrict?.SubDistricts?.find((s: any) => s.ID === subdistrictId);

  console.log("📌 selectedSubdistrict:", selectedSubdistrict);
  console.log("📌 Postcode ID:", selectedSubdistrict?.Postcode?.ID);
  
if (selectedSubdistrict) {
  setSelectedSubdistrict(selectedSubdistrict); // ← set state สำหรับแสดงรหัสไปรษณีย์

  console.log("📌 sub ID:", subdistrictId); // ✅ แยกออกมาไว้ข้างนอก

  form.setFieldsValue({
    subdistrict_id: Number(subdistrictId), // หรือ subdistrict_id ถ้า backend ใช้ชื่อนั้น
    post_code: selectedSubdistrict?.Postcode?.ID || undefined,
  });
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
            <Select
              showSearch
              options={provinceOptions}
              onChange={handleProvinceChange}
              placeholder="เลือกจังหวัด"
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="อำเภอ / เขต"
            name="district"
            rules={[{ required: true, message: 'กรุณาเลือกอำเภอ/เขต' }]}
          >
            <Select
              showSearch
              options={districtOptions}
              onChange={handleDistrictChange}
              placeholder="เลือกอำเภอ / เขต"
              disabled={!districtOptions.length}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="ตำบล / แขวง"
            name="subdistrict_id"
            rules={[{ required: true, message: 'กรุณาเลือกตำบล/แขวง' }]}
          >
            <Select
              showSearch
              options={subdistrictOptions}
              onChange={handleSubdistrictChange}
              placeholder="เลือกตำบล / แขวง"
              disabled={!subdistrictOptions.length}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="รหัสไปรษณีย์"
            name="post_code"
            rules={[{ required: true, message: 'กรุณาเลือกรหัสไปรษณีย์' }]}
          >
            <Select
          disabled={!selectedSubdistrict?.Postcode}
          options={
            selectedSubdistrict?.Postcode
              ? [{
                  label: selectedSubdistrict.Postcode.post_code,
                  value: selectedSubdistrict.Postcode.ID         
                }]
              : []
          }
          placeholder="เลือกรหัสไปรษณีย์"
        />

  </Form.Item>
</Col>
      </Row>
    </>
  );
};

export default StepAddress;
