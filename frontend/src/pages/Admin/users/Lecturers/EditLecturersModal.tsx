import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  type FormInstance,
  message,
  Card,
  Divider,
  Space,
  Button,
  Typography,
  Avatar,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  CloseOutlined,
  IdcardOutlined,
  BankOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  GetAllProvinces,
  GetAllGender,
} from "../../../../services/https/index";
import type { AcademicStaffInterface } from "../../../../interfaces/AcademicStaff";
import { UpdateAcademicStaff } from "../../../../services/https/Admin";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProvincesAndGenders();
  }, [selectedStaff]);

  const updateStaffData = async (values: any) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const loadProvincesAndGenders = async () => {
    try {
      const provincesRes = await GetAllProvinces();
      const provinces = provincesRes.data || provincesRes;

      const gendersRes = await GetAllGender();
      if (Array.isArray(gendersRes)) {
        setGenderOptions(
          gendersRes.map((g) => ({ label: g.name_th, value: g.ID }))
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
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <Title level={4} style={{ margin: 0, color: "#262626" }}>
              แก้ไขข้อมูลอาจารย์
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: #{selectedStaff?.ID}
            </Text>
          </div>
        </div>
      }
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      width={900}
      footer={
        <div style={{ textAlign: "right", padding: "16px 0" }}>
          <Space>
            <Button
              icon={<CloseOutlined />}
              onClick={() => setIsEditModalVisible(false)}
              size="large"
              style={{ borderRadius: "8px" }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => editForm.submit()}
              loading={loading}
              size="large"
              style={{ borderRadius: "8px" }}
            >
              บันทึกการแก้ไข
            </Button>
          </Space>
        </div>
      }
      styles={{
        header: {
          backgroundColor: "#fafafa",
          borderBottom: "1px solid #e8e8e8",
        },
        body: { padding: "24px" },
      }}
    >
      <div style={{ padding: "20px 0" }}>
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
            created_at_formatted: dayjs(selectedStaff?.CreatedAt).format(
              "DD/MM/YYYY HH:mm"
            ),
          }}
          key={selectedStaff?.ID}
        >
          {/* Personal Information Card */}
          <Card
            title={
              <Space>
                <IdcardOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลส่วนตัว</span>
              </Space>
            }
            style={{ marginBottom: "20px" }}
            styles={{
              header: {
                backgroundColor: "#fafafa",
                borderBottom: "2px solid #1890ff",
              },
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="academic_position"
                  label={<span>ตำแหน่งทางวิชาการ</span>}
                  rules={[
                    { required: true, message: "กรุณากรอกตำแหน่งทางวิชาการ" },
                  ]}
                >
                  <Input
                    placeholder="กรอกตำแหน่งทางวิชาการ"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="age" label={<span>อายุ</span>}>
                  <Input
                    type="number"
                    placeholder="กรอกอายุ"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="gender_id"
                  label={<span>เพศ</span>}
                  rules={[{ required: true, message: "กรุณาเลือกเพศ" }]}
                >
                  <Select
                    options={genderOptions}
                    placeholder="เลือกเพศ"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* University Information Card */}
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลสถาบัน</span>
              </Space>
            }
            style={{ marginBottom: "20px" }}
            styles={{
              header: {
                backgroundColor: "#fafafa",
                borderBottom: "2px solid #1890ff",
              },
            }}
          >
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item name="university" label={<span>มหาวิทยาลัย</span>}>
                  <Input
                    placeholder="กรอกชื่อมหาวิทยาลัย"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="faculty" label={<span>คณะ</span>}>
                  <Input
                    placeholder="กรอกชื่อคณะ"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department" label={<span>ภาควิชา</span>}>
                  <Input
                    placeholder="กรอกชื่อภาควิชา"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Address Information Card */}
          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลที่อยู่</span>
              </Space>
            }
            style={{ marginBottom: "20px" }}
            styles={{
              header: {
                backgroundColor: "#fafafa",
                borderBottom: "2px solid #1890ff",
              },
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name={["Address", "house_number"]}
                  label={<span>บ้านเลขที่</span>}
                  rules={[{ required: true, message: "กรุณากรอกบ้านเลขที่" }]}
                >
                  <Input
                    placeholder="กรอกบ้านเลขที่"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["Address", "village"]}
                  label={<span>หมู่บ้าน</span>}
                >
                  <Input
                    placeholder="กรอกชื่อหมู่บ้าน"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["Address", "street"]}
                  label={<span>ถนน</span>}
                >
                  <Input
                    placeholder="กรอกชื่อถนน"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["Address", "sub_street"]}
                  label={<span>ซอย</span>}
                >
                  <Input
                    placeholder="กรอกชื่อซอย"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">
              <Space>
                <EnvironmentOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลพื้นที่</span>
              </Space>
            </Divider>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={<span>จังหวัด</span>}
                  name={["Address", "Province"]}
                  rules={[{ required: true, message: "กรุณาเลือกจังหวัด" }]}
                >
                  <Select
                    showSearch
                    options={provinceOptions}
                    onChange={handleProvinceChange}
                    placeholder="เลือกจังหวัด"
                    size="large"
                    style={{ borderRadius: "8px" }}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>อำเภอ / เขต</span>}
                  name={["Address", "District"]}
                  rules={[{ required: true, message: "กรุณาเลือกอำเภอ / เขต" }]}
                >
                  <Select
                    showSearch
                    options={districtOptions}
                    onChange={handleDistrictChange}
                    placeholder="เลือกอำเภอ / เขต"
                    disabled={!districtOptions.length}
                    size="large"
                    style={{ borderRadius: "8px" }}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>ตำบล / แขวง</span>}
                  name={["Address", "SubDistrict"]}
                  rules={[{ required: true, message: "กรุณาเลือกตำบล / แขวง" }]}
                >
                  <Select
                    showSearch
                    options={subdistrictOptions}
                    onChange={handleSubdistrictChange}
                    placeholder="เลือกตำบล / แขวง"
                    disabled={!subdistrictOptions.length}
                    size="large"
                    style={{ borderRadius: "8px" }}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span>รหัสไปรษณีย์</span>}
                  name={["Address", "Postcode"]}
                  rules={[
                    { required: true, message: "กรุณาเลือกรหัสไปรษณีย์" },
                  ]}
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
                    placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติ"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          {/* Registration Information */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลการสมัคร</span>
              </Space>
            }
            styles={{
              header: {
                backgroundColor: "#fafafa",
                borderBottom: "2px solid #1890ff",
              },
            }}
          >
            <Form.Item name="created_at_formatted" label="วันที่สมัครสมาชิก">
              <Input
                disabled
                size="large"
                className="adminpage-input-disabled"
                prefix={<CalendarOutlined style={{ color: "#1890ff" }} />}
              />
            </Form.Item>
          </Card>
        </Form>
      </div>
    </Modal>
  );
};

export default LecturersEditModal;
