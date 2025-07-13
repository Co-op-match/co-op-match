import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  message,
  Steps,
} from "antd";
import Title from "antd/es/typography/Title";
import { GetAllGender, GetAllProvinces } from "../../../../services/https";
import {
  CreateAcademicStaff,
  CreateUserAcademicStaffContact,
} from "../../../../services/https/aum";
const { Step } = Steps;

interface AddLecturersModalProps {
  isAddModalVisible: boolean;
  setIsAddModalVisible: (visible: boolean) => void;
  reload: boolean;
  setReload: (val: boolean) => void;
}

const AddLecturersModal: React.FC<AddLecturersModalProps> = ({
  isAddModalVisible,
  setIsAddModalVisible,
  reload,
  setReload,
}) => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);
  const [formStepValues, setFormStepValues] = useState<any>({});

  useEffect(() => {
    const loadProvinces = async () => {
      const provincesRes = await GetAllProvinces();
      setRawProvinces(provincesRes.data || provincesRes);

      const gendersRes = await GetAllGender();
      if (Array.isArray(gendersRes)) {
        setGenderOptions(
          gendersRes.map((g) => ({ label: g.name, value: g.ID }))
        );
      }
    };
    loadProvinces();
  }, [reload]);

  const handleNext = async () => {
    try {
      const currentValues = await form.validateFields();
      setFormStepValues({ ...formStepValues, ...currentValues });
      setStep(step + 1);
      form.resetFields();
    } catch (err) {
      message.error("กรุณากรอกข้อมูลให้ครบ");
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

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

  const handleSubmit = async () => {
    try {
      const finalValues = await form.validateFields();
      const values = { ...formStepValues, ...finalValues };
      const user = values.User || {};

      if (!user.Email || !user.Password) {
        message.error("กรุณากรอกอีเมลและรหัสผ่าน");
        return;
      }

      const adminId = localStorage.getItem("id");
      if (!adminId) {
        message.error("ไม่พบข้อมูลผู้ดูแลระบบใน localStorage");
        return;
      }

      const formData = new FormData();
      formData.append("email", user.Email);
      formData.append("password", user.Password);
      formData.append("role_id", "4");
      formData.append("academic_position", values.academic_position);
      formData.append("age", values.age.toString());
      formData.append("faculty", values.faculty);
      formData.append("department", values.department);
      formData.append("university", values.university);
      formData.append("admin_id", adminId);
      formData.append("gender_id", values.gender_id.toString());
      formData.append(
        "address_province_id",
        values.Address.Province.toString()
      );
      formData.append(
        "address_district_id",
        values.Address.District.toString()
      );
      formData.append(
        "address_sub_district_id",
        values.Address.SubDistrict.toString()
      );
      formData.append(
        "address_postcode_id",
        values.Address.Postcode.toString()
      );
      formData.append("address_house_number", values.Address.house_number);
      formData.append("address_village", values.Address.village || "");
      formData.append("address_street", values.Address.street || "");
      formData.append("address_sub_street", values.Address.sub_street || "");
      formData.append("contact_phone", values.Contact.PhoneNumber);
      formData.append("contact_email", values.Contact.Email);
      formData.append("contact_website", values.Contact.Website || "");
      formData.append("contact_line", values.Contact.Line || "");
      formData.append("contact_facebook", values.Contact.Facebook || "");

      const res = await CreateUserAcademicStaffContact(formData);

      if (res.status === 201) {
        message.success("เพิ่มอาจารย์สำเร็จ");
        setIsAddModalVisible(false);
        form.resetFields();
        setReload(!reload);
        setStep(0);
      } else {
        message.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาด");
      console.error(err);
    }
  };

  return (
    <Modal
      title="เพิ่มอาจารย์ใหม่"
      open={isAddModalVisible}
      onCancel={() => {
        setIsAddModalVisible(false);
        form.resetFields();
        setStep(0);
      }}
      footer={null}
      width={800}
    >
      <Steps current={step} style={{ marginBottom: 24 }}>
        <Step title="บัญชีผู้ใช้" />
        <Step title="ข้อมูลติดต่อ" />
        <Step title="ข้อมูลอาจารย์" />
      </Steps>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        onFinishFailed={() => message.error("กรุณากรอกข้อมูลให้ครบถ้วน")}
        initialValues={{ Address: {} }}
      >
        {step === 0 && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["User", "Email"]}
                label="อีเมล"
                rules={[{ required: true, type: "email" }]}
              >
                
                <Input autoComplete="username" />
              </Form.Item>
              <Form.Item
                name={["User", "Password"]}
                label="รหัสผ่าน"
                rules={[{ required: true }]}
              >
                
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name={["User", "ConfirmPassword"]}
                label="ยืนยันรหัสผ่าน"
                dependencies={[["User", "Password"]]}
                rules={[
                  { required: true, message: "กรุณายืนยันรหัสผ่าน" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        getFieldValue(["User", "Password"]) === value
                      )
                        return Promise.resolve();
                      return Promise.reject("รหัสผ่านไม่ตรงกัน");
                    },
                  }),
                ]}
              >
                
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {step === 1 && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["Contact", "PhoneNumber"]}
                label="เบอร์โทรศัพท์"
              >
                
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={["Contact", "Email"]} label="อีเมลติดต่อ">
                
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={["Contact", "Website"]} label="เว็บไซต์">
                
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={["Contact", "Facebook"]} label="Facebook">
                
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={["Contact", "Line"]} label="Line">
                
                <Input />
              </Form.Item>
            </Col>
          </Row>
        )}

        {step === 2 && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="academic_position"
                  label="ตำแหน่ง"
                  rules={[{ required: true }]}
                >
                  
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="age" label="อายุ">
                  
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="faculty"
                  label="คณะ"
                  rules={[{ required: true }]}
                >
                  
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label="ภาควิชา"
                  rules={[{ required: true }]}
                >
                  
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="university"
                  label="มหาวิทยาลัย"
                  rules={[{ required: true }]}
                >
                  
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
                  name={["Address", "Province"]}
                  label="จังหวัด"
                  rules={[{ required: true }]}
                >
                  
                  <Select
                    options={rawProvinces.map((p) => ({
                      label: p.name_th,
                      value: p.ID,
                    }))}
                    onChange={handleProvinceChange}
                    placeholder="เลือกจังหวัด"
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
                    options={districtOptions}
                    onChange={handleDistrictChange}
                    disabled={!districtOptions.length}
                    placeholder="เลือกอำเภอ / เขต"
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
                    options={subdistrictOptions}
                    onChange={handleSubdistrictChange}
                    disabled={!subdistrictOptions.length}
                    placeholder="เลือกตำบล / แขวง"
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
          </>
        )}

        <Row justify="end" style={{ marginTop: 24 }} gutter={16}>
          {step > 0 && <Button onClick={handlePrevious}>ย้อนกลับ</Button>}
          {step < 2 && (
            <Button type="primary" onClick={handleNext}>
              ถัดไป
            </Button>
          )}
          {step === 2 && (
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          )}
        </Row>
      </Form>
    </Modal>
  );
};
export default AddLecturersModal;
