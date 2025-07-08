import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Row, Col, Select, Image, type FormInstance } from 'antd';
import Title from 'antd/es/typography/Title';
import dayjs from 'dayjs';
import type { CompanyInterface } from '../../../../interfaces/Company';

interface CompanyEditModalProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: (value: boolean) => void;
  editForm: FormInstance;
  currentCompany: CompanyInterface | null;
  updateCompanyData: (values: any) => Promise<void>;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({
  isEditModalVisible,
  setIsEditModalVisible,
  editForm,
  currentCompany,
  updateCompanyData,
}) => {
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
    editForm.setFieldsValue({ Address: { district: undefined, subdistrict: undefined, post_code: undefined } });
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
    editForm.setFieldsValue({ Address: { subdistrict: undefined, post_code: undefined } });
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
      editForm.setFieldsValue({ Address: { post_code: String(selectedTambon.zip_code) } });
    }
  };

  return (
    <Modal
      title="แก้ไขข้อมูลบริษัท"
      open={isEditModalVisible}
      onOk={() => editForm.submit()}
      onCancel={() => setIsEditModalVisible(false)}
      okText="บันทึก"
      cancelText="ยกเลิก"
      width={800}
    >
      <Form
        form={editForm}
        layout="vertical"
        onFinish={updateCompanyData}
        initialValues={{
          ...currentCompany,
          Address: currentCompany?.Address,
          created_at_formatted: dayjs(currentCompany?.CreatedAt).format("DD/MM/YYYY HH:mm"),
        }}
        key={currentCompany?.ID}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item
              name="company_name"
              label="ชื่อบริษัท"
              rules={[{ required: true, message: "กรุณาระบุชื่อบริษัท" }]}
            >
              <Input placeholder="ชื่อบริษัท" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="logo"
              label="โลโก้ (URL)"
              rules={[{ type: "url", message: "URL โลโก้ไม่ถูกต้อง" }]}
            >
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>
          </Col>
        </Row>

        {editForm.getFieldValue("logo") && (
          <Row justify="start" style={{ marginBottom: 24 }}>
            <Col>
              <p>ตัวอย่างโลโก้:</p>
              <Image
                src={editForm.getFieldValue("logo")}
                alt="โลโก้บริษัท"
                width={150}
                height={150}
                style={{ objectFit: "contain", border: "1px solid #ccc", padding: 8 }}
              />
            </Col>
          </Row>
        )}

        <Title level={5} style={{ marginTop: 16 }}>ที่อยู่</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={["Address", "house_number"]}
              label="บ้านเลขที่"
              rules={[{ required: true, message: "กรุณาระบุบ้านเลขที่" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={["Address", "village"]} label="หมู่บ้าน">
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name={["Address", "street"]} label="ถนน">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={["Address", "sub_street"]} label="ซอย">
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name={["Address", "province"]}
              label="จังหวัด"
              rules={[{ required: true, message: "กรุณาเลือกจังหวัด" }]}
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
              name={["Address", "district"]}
              label="อำเภอ / เขต"
              rules={[{ required: true, message: "กรุณาเลือกอำเภอ/เขต" }]}
            >
              <Select placeholder="เลือกอำเภอ / เขต" disabled={!amphures.length} onChange={handleAmphureChange}>
                {amphures.map(a => (
                  <Select.Option key={a.id} value={a.name_th}>{a.name_th}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name={["Address", "subdistrict"]}
              label="ตำบล / แขวง"
              rules={[{ required: true, message: "กรุณาเลือกตำบล/แขวง" }]}
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
              name={["Address", "post_code"]}
              label="รหัสไปรษณีย์"
              rules={[{ required: true, message: "กรุณากรอกรหัสไปรษณีย์" }]}
            >
              <Input maxLength={5} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="created_at_formatted" label="วันที่สมัคร">
          <Input disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanyEditModal;