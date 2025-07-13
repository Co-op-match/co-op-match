import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Image,
  Button,
  type FormInstance,
} from "antd";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import type { CompanyInterface } from "../../../../interfaces/Company";
import { GetAllProvinces } from "../../../../services/https/index";

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
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await GetAllProvinces(); // เรียกแค่ตัวเดียว
        const data = res.data || res;
        setRawProvinces(data);
        setProvinceOptions(
          data.map((p: any) => ({
            label: p.name_th,
            value: p.ID,
          }))
        );

        if (currentCompany?.Address?.Province?.ID) {
          // set ค่า default + preload ตัวเลือก
          const province = data.find(
            (p: any) => p.ID === currentCompany.Address?.Province?.ID
          );
          if (province) {
            setDistrictOptions(
              province.Districts.map((d: any) => ({
                label: d.name_th,
                value: d.ID,
              }))
            );

            const district = province.Districts.find(
              (d: any) => d.ID === currentCompany.Address?.District?.ID
            );
            if (district) {
              setSubdistrictOptions(
                district.SubDistricts.map((s: any) => ({
                  label: s.name_th,
                  value: s.ID,
                  data: s,
                }))
              );

              const subdistrict = district.SubDistricts.find(
                (s: any) => s.ID === currentCompany.Address?.SubDistrict?.ID
              );
              if (subdistrict) {
                setSelectedSubdistrict(subdistrict);

                editForm.setFieldsValue({
                  Address: {
                    Province: province.ID,
                    District: district.ID,
                    SubDistrict: subdistrict.ID,
                    Postcode: subdistrict.Postcode?.ID,
                  },
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("โหลดจังหวัดล้มเหลว:", err);
      }
    };

    loadProvinces();
  }, [currentCompany]);

  const handleProvinceChange = (provinceId: number) => {
    const province = rawProvinces.find((p: any) => p.ID === provinceId);
    if (province) {
      const districts = province.Districts || [];
      setDistrictOptions(
        districts.map((d: any) => ({ label: d.name_th, value: d.ID }))
      );
      setSubdistrictOptions([]);
      setSelectedSubdistrict(null);

      editForm.setFieldsValue({
        Address: {
          Province: provinceId,
          District: undefined,
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };

  const handleDistrictChange = (districtId: number) => {
    const provinceId = editForm.getFieldValue(["Address", "Province"]);
    const province = rawProvinces.find((p: any) => p.ID === provinceId);
    const district = province?.Districts.find((d: any) => d.ID === districtId);
    if (district) {
      const subs = district.SubDistricts || [];
      setSubdistrictOptions(
        subs.map((s: any) => ({
          label: s.name_th,
          value: s.ID,
          data: s,
        }))
      );
      setSelectedSubdistrict(null);

      editForm.setFieldsValue({
        Address: {
          District: districtId,
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };

  const handleSubdistrictChange = (subId: number, option: any) => {
    setSelectedSubdistrict(option.data);

    editForm.setFieldsValue({
      Address: {
        SubDistrict: subId,
        Postcode: option.data?.Postcode?.ID,
      },
    });
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
          created_at_formatted: dayjs(currentCompany?.CreatedAt).format(
            "DD/MM/YYYY HH:mm"
          ),
        }}
        key={currentCompany?.ID}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item
              name="company_name"
              label="ชื่อบริษัท"
              rules={[{ required: true }]}
            >
              <Input placeholder="ชื่อบริษัท" />
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

        {editForm.getFieldValue("logo") && (
          <Row justify="start" style={{ marginBottom: 24 }}>
            <Col>
              <p>ตัวอย่างโลโก้:</p>
              <Image
                src={editForm.getFieldValue("logo")}
                alt="โลโก้บริษัท"
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
              label="จังหวัด"
              name={["Address", "Province"]}
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                options={provinceOptions}
                onChange={handleProvinceChange}
                placeholder="เลือกจังหวัด"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="อำเภอ / เขต"
              name={["Address", "District"]}
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                options={districtOptions}
                onChange={handleDistrictChange}
                placeholder="เลือกอำเภอ / เขต"
                disabled={!districtOptions.length}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="ตำบล / แขวง"
              name={["Address", "SubDistrict"]}
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                options={subdistrictOptions}
                onChange={handleSubdistrictChange}
                placeholder="เลือกตำบล / แขวง"
                disabled={!subdistrictOptions.length}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="รหัสไปรษณีย์"
              name={["Address", "Postcode"]}
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

        <Form.Item name="created_at_formatted" label="วันที่สมัคร">
          <Input disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanyEditModal;
