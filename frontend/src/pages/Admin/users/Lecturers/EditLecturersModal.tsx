import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  type FormInstance,
  message,
} from "antd";
import Title from "antd/es/typography/Title";
import {
  GetAllProvinces,
  GetAllGender,
} from "../../../../services/https/index";
import type { AcademicStaffInterface } from "../../../../interfaces/AcademicStaff";
import { UpdateAcademicStaff } from "../../../../services/https/aum";

interface LecturersEditModalProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: (value: boolean) => void;
  editForm: FormInstance;
  selectedStaff: AcademicStaffInterface | null;
  setReload: React.Dispatch<React.SetStateAction<boolean>>;
  reload: boolean;
}

const LecturersEditModal: React.FC<LecturersEditModalProps> = ({
  isEditModalVisible,
  setIsEditModalVisible,
  editForm,
  selectedStaff,
  setReload,
  reload,
}) => {
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);
  const [genderOptions, setGenderOptions] = useState<any[]>([]);

  useEffect(() => {
    loadProvincesAndGenders();
  }, [selectedStaff]);

  const updateStaffData = async (values: any) => {
    try {
      const res = await UpdateAcademicStaff(selectedStaff?.ID!, {
        ...values,
        address_id: selectedStaff?.address_id,
        admin_id: selectedStaff?.admin_id,
        gender_id: values.gender_id,
      });
      if (res.status === 200) {
        message.success("อัปเดตข้อมูลอาจารย์เรียบร้อยแล้ว");
        setIsEditModalVisible(false);
        setReload(!reload);
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
      console.error(err);
    }
  };

  const loadProvincesAndGenders = async () => {
    try {
      const provincesRes = await GetAllProvinces();
      const provinces = provincesRes.data || provincesRes;

      const gendersRes = await GetAllGender();
      if (Array.isArray(gendersRes)) {
        setGenderOptions(
          gendersRes.map((g) => ({ label: g.name, value: g.ID }))
        );
      }

      setRawProvinces(provinces);

      setProvinceOptions(
        provinces.map((p: any) => ({ label: p.name_th, value: p.ID }))
      );

      if (selectedStaff?.Address?.Province?.ID) {
        const province = provinces.find(
          (p: any) => p.ID === selectedStaff.Address?.Province?.ID
        );
        if (province) {
          setDistrictOptions(
            province.Districts.map((d: any) => ({
              label: d.name_th,
              value: d.ID,
            }))
          );
          const district = province.Districts.find(
            (d: any) => d.ID === selectedStaff.Address?.District?.ID
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
              (s: any) => s.ID === selectedStaff.Address?.SubDistrict?.ID
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
      console.error("โหลดข้อมูลล้มเหลว:", err);
    }
  };

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
      title="แก้ไขข้อมูลอาจารย์"
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
        onFinish={updateStaffData}
        initialValues={{
          ...selectedStaff,
          Address: {
            Province: selectedStaff?.Address?.Province?.ID,
            District: selectedStaff?.Address?.District?.ID,
            SubDistrict: selectedStaff?.Address?.SubDistrict?.ID,
            Postcode: selectedStaff?.Address?.Postcode?.ID,
          },
          gender_id: selectedStaff?.Gender?.ID,
        }}
        key={selectedStaff?.ID}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="academic_position"
              label="ตำแหน่งทางวิชาการ"
              rules={[{ required: true }]}
            >
              <Input placeholder="ตำแหน่งทางวิชาการ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="age" label="อายุ">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="faculty" label="คณะ">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="ภาควิชา">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="university" label="มหาวิทยาลัย">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="gender_id"
              label="เพศ"
              rules={[{ required: true }]}
            >
              <Select options={genderOptions} placeholder="เลือกเพศ" />
            </Form.Item>
          </Col>
        </Row>

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
      </Form>
    </Modal>
  );
};

export default LecturersEditModal;
