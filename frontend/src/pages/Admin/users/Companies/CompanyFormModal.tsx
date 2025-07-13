import React from "react";
import { Form, Input, Select, Row, Col, Image, Typography } from "antd";
import type { FormInstance } from "antd";

const { Title } = Typography;

export interface CompanyFormProps {
  form: FormInstance;
  rawProvinces: any[];
  districtOptions: any[];
  subdistrictOptions: any[];
  selectedSubdistrict: any;
  onFinish: (values: any) => void;
  onProvinceChange: (id: number) => void;
  onDistrictChange: (id: number) => void;
  onSubdistrictChange: (id: number, option: any) => void;
  isEdit?: boolean;
  initialValues?: any;
}

const CompanyFormModal: React.FC<CompanyFormProps> = ({
  form,
  rawProvinces,
  districtOptions,
  subdistrictOptions,
  selectedSubdistrict,
  onFinish,
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
  isEdit = false,
  initialValues,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues || { Address: {} }}
    >
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="company_name"
            label="ชื่อบริษัท"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="logo"
            label="โลโก้ (URL)"
            rules={[{ type: "url" }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      {form.getFieldValue("logo") && (
        <Row style={{ marginBottom: 16 }}>
          <Col>
            <Image
              src={form.getFieldValue("logo")}
              width={150}
              height={150}
              style={{
                objectFit: "contain",
                border: "1px solid #ccc",
                padding: 8,
              }}
            />
          </Col>
        </Row>
      )}

      <Title level={5}>ที่อยู่</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={["Address", "house_number"]}
            label="บ้านเลขที่"
            rules={[{ required: true }]}
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
            name={["Address", "Province"]}
            label="จังหวัด"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="เลือกจังหวัด"
              options={rawProvinces.map((p) => ({
                label: p.name_th,
                value: p.ID,
              }))}
              onChange={onProvinceChange}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={["Address", "District"]}
            label="อำเภอ / เขต"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={districtOptions}
              onChange={onDistrictChange}
              disabled={!districtOptions.length}
              placeholder="เลือกอำเภอ"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={["Address", "SubDistrict"]}
            label="ตำบล / แขวง"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={subdistrictOptions}
              onChange={onSubdistrictChange}
              disabled={!subdistrictOptions.length}
              placeholder="เลือกตำบล"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={["Address", "Postcode"]}
            label="รหัสไปรษณีย์"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!selectedSubdistrict?.Postcode}
              options={
                selectedSubdistrict?.Postcode
                  ? [
                      {
                        label: selectedSubdistrict.Postcode.post_code,
                        value: selectedSubdistrict.Postcode.ID,
                      },
                    ]
                  : []
              }
            />
          </Form.Item>
        </Col>
      </Row>

      {isEdit && (
        <Form.Item name="created_at_formatted" label="วันที่สมัคร">
          <Input disabled />
        </Form.Item>
      )}
    </Form>
  );
};

export default CompanyFormModal;