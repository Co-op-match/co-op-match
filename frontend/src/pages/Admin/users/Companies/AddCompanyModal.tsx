import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  Image,
} from "antd";
import Title from "antd/es/typography/Title";
import { GetAllProvinces } from "../../../../services/https/index";

interface AddCompanyModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isVisible,
  setIsVisible,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);

  useEffect(() => {
    const loadProvinces = async () => {
      const res = await GetAllProvinces();
      const data = res.data || res;
      setRawProvinces(data);
    };
    loadProvinces();
  }, []);

  const handleProvinceChange = (provinceId: number) => {
    const province = rawProvinces.find((p) => p.ID === provinceId);
    if (province) {
      setDistrictOptions(
        province.Districts.map((d: any) => ({ label: d.name_th, value: d.ID }))
      );
      setSubdistrictOptions([]);
      setSelectedSubdistrict(null);
      form.setFieldsValue({
        Address: {
          District: undefined,
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };

  const handleDistrictChange = (districtId: number) => {
    const provinceId = form.getFieldValue(["Address", "Province"]);
    const province = rawProvinces.find((p) => p.ID === provinceId);
    const district = province?.Districts.find((d: any) => d.ID === districtId);
    if (district) {
      setSubdistrictOptions(
        district.SubDistricts.map((s: any) => ({
          label: s.name_th,
          value: s.ID,
          data: s,
        }))
      );
      setSelectedSubdistrict(null);
      form.setFieldsValue({
        Address: {
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };

  const handleSubdistrictChange = (subId: number, option: any) => {
    setSelectedSubdistrict(option.data);
    form.setFieldsValue({
      Address: {
        Postcode: option.data?.Postcode?.ID,
      },
    });
  };

  return (
    <Modal
      title="เพิ่มบริษัทใหม่"
      open={isVisible}
      onCancel={() => setIsVisible(false)}
      onOk={() => form.submit()}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ Address: {} }}
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
                style={{ objectFit: "contain", border: "1px solid #ccc", padding: 8 }}
              />
            </Col>
          </Row>
        )}

        <Title level={5}>ที่อยู่</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={["Address", "house_number"]} label="บ้านเลขที่" rules={[{ required: true }]}> <Input /> </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={["Address", "village"]} label="หมู่บ้าน"> <Input /> </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={["Address", "street"]} label="ถนน"> <Input /> </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={["Address", "sub_street"]} label="ซอย"> <Input /> </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name={["Address", "Province"]} label="จังหวัด" rules={[{ required: true }]}> <Select
              options={rawProvinces.map((p: any) => ({ label: p.name_th, value: p.ID }))}
              onChange={handleProvinceChange}
              showSearch
              placeholder="เลือกจังหวัด"
            /> </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name={["Address", "District"]} label="อำเภอ / เขต" rules={[{ required: true }]}> <Select
              options={districtOptions}
              onChange={handleDistrictChange}
              disabled={!districtOptions.length}
              showSearch
              placeholder="เลือกอำเภอ / เขต"
            /> </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name={["Address", "SubDistrict"]} label="ตำบล / แขวง" rules={[{ required: true }]}> <Select
              options={subdistrictOptions}
              onChange={handleSubdistrictChange}
              disabled={!subdistrictOptions.length}
              showSearch
              placeholder="เลือกตำบล / แขวง"
            /> </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name={["Address", "Postcode"]} label="รหัสไปรษณีย์" rules={[{ required: true }]}> <Select
              options={selectedSubdistrict?.Postcode
                ? [{
                    label: selectedSubdistrict.Postcode.post_code,
                    value: selectedSubdistrict.Postcode.ID,
                  }]
                : []}
              disabled={!selectedSubdistrict?.Postcode}
            /> </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddCompanyModal;