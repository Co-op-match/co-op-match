import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Image,
  type FormInstance,
  message,
  Card,
  Divider,
  Space,
  Avatar,
  Upload,
  Button,
  Typography,
  Spin,
} from "antd";
import {
  BuildOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  CalendarOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { CompanyInterface } from "../../../../interfaces/Company";
import {
  GetAllProvinces,
  UpdateCompany,
} from "../../../../services/https/index";
import "../users.css";

const { Title, Text } = Typography;

interface CompanyEditModalProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: (value: boolean) => void;
  editForm: FormInstance;
  currentCompany: CompanyInterface | null;
  setReload: React.Dispatch<React.SetStateAction<boolean>>;
  reload: boolean;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({
  isEditModalVisible,
  setIsEditModalVisible,
  editForm,
  currentCompany,
  setReload,
  reload,
}) => {
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<any>(null);

  useEffect(() => {
    if (currentCompany) {
      loadProvinces();
      setLogoPreview(
        currentCompany.logo
          ? currentCompany.logo.startsWith("http")
            ? currentCompany.logo
            : `http://localhost:8000${currentCompany.logo}`
          : ""
      );
    }
  }, [currentCompany]);

  const updateCompanyData = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();

      let logoUrl = logoPreview;

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      formData.append(
        "json_data",
        JSON.stringify({
          company_name: values.company_name,
          Address: {
            house_number: values.Address.house_number,
            village: values.Address.village,
            street: values.Address.street,
            sub_street: values.Address.sub_street,
            Province: values.Address.Province,
            District: values.Address.District,
            SubDistrict: values.Address.SubDistrict,
            Postcode: values.Address.Postcode,
          },
        })
      );

      console.log(formData.get("json_data"));

      const res = await UpdateCompany(currentCompany?.ID!, formData);
      if (res.status === 200) {
        message.success("อัปเดตข้อมูลบริษัทเรียบร้อยแล้ว");
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

  const loadProvinces = async () => {
    try {
      const res = await GetAllProvinces();
      const data = res.data || res;
      setRawProvinces(data);
      setProvinceOptions(
        data.map((p: any) => ({
          label: p.name_th,
          value: p.ID,
        }))
      );

      if (currentCompany?.Address?.Province?.ID) {
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
      message.error("โหลดข้อมูลจังหวัดล้มเหลว");
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

  const handleCancel = () => {
    setIsEditModalVisible(false);
    setLogoPreview("");
    setLogoFile(null);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setLogoFile(file);
      editForm.setFieldsValue({ logo: result });
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            size={40}
            icon={<BuildOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <Title level={4} style={{ margin: 0, color: "#262626" }}>
              แก้ไขข้อมูลบริษัท
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: #{currentCompany?.ID}
            </Text>
          </div>
        </div>
      }
      open={isEditModalVisible}
      onOk={() => editForm.submit()}
      onCancel={handleCancel}
      width={"80vw"}
      styles={{
        body: { padding: "24px" },
      }}
      footer={[
        <Button
          key="cancel"
          icon={<CloseOutlined />}
          onClick={handleCancel}
          size="large"
        >
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => editForm.submit()}
          loading={loading}
          size="large"
        >
          บันทึกการแก้ไข
        </Button>,
      ]}
    >
      <Spin spinning={loading} tip="กำลังบันทึกข้อมูล...">
        <Form
          form={editForm}
          layout="vertical"
          onFinish={updateCompanyData}
          initialValues={{
            ...currentCompany,
            Address: {
              Province: currentCompany?.Address?.Province?.ID,
              District: currentCompany?.Address?.District?.ID,
              SubDistrict: currentCompany?.Address?.SubDistrict?.ID,
              Postcode: currentCompany?.Address?.Postcode?.ID,
            },
            created_at_formatted: dayjs(currentCompany?.CreatedAt).format(
              "DD/MM/YYYY HH:mm"
            ),
          }}
          key={currentCompany?.ID}
        >
          {/* Company Information Section */}
          <Card
            title={
              <Space>
                <BuildOutlined style={{ color: "#1890ff" }} />
                <span>ข้อมูลบริษัท</span>
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
            <Row gutter={24} justify={"space-between"}>
              <Col span={16}>
                <Form.Item
                  name="company_name"
                  label={
                    <span>
                      ชื่อบริษัท
                    </span>
                  }
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อบริษัท" },
                    { min: 2, message: "ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร" },
                  ]}
                >
                  <Input
                    placeholder="กรอกชื่อบริษัท"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      fontWeight: "bold",
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    โลโก้บริษัท
                  </label>
                  <Upload
                    name="logo"
                    listType="picture-card"
                    className="adminpage-logo-uploader"
                    showUploadList={false}
                    accept="image/*"
                    beforeUpload={handleLogoUpload}
                  >
                    {logoPreview ? (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <img
                          src={logoPreview}
                          alt="logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                        <div className="adminpage-upload-overlay">คลิกเพื่อเปลี่ยน</div>
                      </div>
                    ) : (
                      <div className="adminpage-upload-card-placeholder">
                        <UploadOutlined
                          style={{ fontSize: "24px", marginBottom: "8px" }}
                        />
                        <div style={{ fontSize: "12px", textAlign: "center" }}>
                          อัปโหลด
                          <br />
                          โลโก้
                        </div>
                      </div>
                    )}
                  </Upload>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      marginTop: "4px",
                    }}
                  >
                    รองรับ JPG, PNG, GIF (ไม่เกิน 5MB)
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Address Information Section */}
          <Card
            title={
              <Space>
                <HomeOutlined style={{ color: "#1890ff" }} />
                <span>ที่อยู่บริษัท</span>
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
            {/* Basic Address Fields */}
            <Row gutter={16} style={{ marginBottom: "16px" }}>
              <Col span={12}>
                <Form.Item
                  name={["Address", "house_number"]}
                  label="บ้านเลขที่"
                  rules={[{ required: true, message: "กรุณากรอกบ้านเลขที่" }]}
                >
                  <Input
                    placeholder="เช่น 123/45"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["Address", "village"]} label="หมู่บ้าน">
                  <Input
                    placeholder="เช่น หมู่บ้านสวนดอกไม้"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: "16px" }}>
              <Col span={12}>
                <Form.Item name={["Address", "street"]} label="ถนน">
                  <Input
                    placeholder="เช่น ถนนสุขุมวิท"
                    size="large"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["Address", "sub_street"]} label="ซอย">
                  <Input
                    placeholder="เช่น ซอยอโศก"
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

            {/* Location Selection */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="จังหวัด"
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
                      (option?.label as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    notFoundContent="ไม่พบจังหวัด"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="อำเภอ / เขต"
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
                    filterOption={(input, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    notFoundContent={
                      !districtOptions.length
                        ? "กรุณาเลือกจังหวัดก่อน"
                        : "ไม่พบอำเภอ"
                    }
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="ตำบล / แขวง"
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
                    filterOption={(input, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    notFoundContent={
                      !subdistrictOptions.length
                        ? "กรุณาเลือกอำเภอก่อน"
                        : "ไม่พบตำบล"
                    }
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="รหัสไปรษณีย์"
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
                    placeholder="รหัสไปรษณีย์"
                    size="large"
                    notFoundContent="กรุณาเลือกตำบลก่อน"
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
      </Spin>
    </Modal>
  );
};

export default CompanyEditModal;
