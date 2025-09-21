import React, { useEffect, useState } from "react";
import { Form, Select, Input, Divider, Space } from "antd";
import { HomeOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { GetAllProvinces } from "../../../../../services/https";

interface SelectOption {
  label: string;
  value: number;
}

interface AddressFormProps {
  form: any;
  initialData?: any;
  onChange?: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ form, initialData, onChange }) => {
  const [provinceOptions, setProvinceOptions] = useState<SelectOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<SelectOption[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<SelectOption[]>([]);
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await GetAllProvinces();
        const provinces = res.data || res;

        setRawProvinces(provinces);
        setProvinceOptions(
          provinces.map((p: any) => ({
            label: p.name_th,
            value: Number(p.ID),
          }))
        );

        const init = initialData?.Address;
        if (init) {
          const province = provinces.find((p: any) => p.ID === init.Province?.ID);
          const districts = province?.Districts || [];
          const selectedDistrict = districts.find((d: any) => d.ID === init.District?.ID);
          const subdistricts = selectedDistrict?.SubDistricts || [];

          setDistrictOptions(
            districts.map((d: any) => ({
              label: d.name_th,
              value: Number(d.ID),
            }))
          );

          setSubdistrictOptions(
            subdistricts.map((s: any) => ({
              label: s.name_th,
              value: Number(s.ID),
            }))
          );

          // ✅ ตั้งค่า form หลังจากที่ options พร้อมแล้ว
          setTimeout(() => {
            form.setFieldsValue({
              house_number: init.house_number,
              village: init.village,
              street: init.street,
              sub_street: init.sub_street,
              province_id: init.Province?.ID,
              district_id: init.District?.ID,
              subdistrict_id: init.SubDistrict?.ID,
              postcode: init.Postcode?.post_code,
              postcode_id: init.Postcode?.ID,
            });
          }, 50);
        }
      } catch (err) {
        console.error("Error loading address data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData, form]);

  const handleProvinceChange = (provinceId: number) => {
    const province = rawProvinces.find((p) => p.ID === provinceId);
    const districts = province?.Districts || [];

    form.setFieldsValue({
      province_id: provinceId,
      district_id: undefined,
      subdistrict_id: undefined,
      postcode: undefined,
      postcode_id: undefined,
    });

    setDistrictOptions(
      districts.map((d: any) => ({
        label: d.name_th,
        value: Number(d.ID),
      }))
    );
    setSubdistrictOptions([]);
    onChange?.();
  };

  const handleDistrictChange = (districtId: number) => {
    const provinceId = form.getFieldValue("province_id");
    const province = rawProvinces.find((p) => p.ID === provinceId);
    const district = province?.Districts?.find((d: any) => d.ID === districtId);
    const subdistricts = district?.SubDistricts || [];

    form.setFieldsValue({
      district_id: districtId,
      subdistrict_id: undefined,
      postcode: undefined,
      postcode_id: undefined,
    });

    setSubdistrictOptions(
      subdistricts.map((s: any) => ({
        label: s.name_th,
        value: Number(s.ID),
      }))
    );
    onChange?.();
  };

  const handleSubdistrictChange = (subId: number) => {
    const provinceId = form.getFieldValue("province_id");
    const districtId = form.getFieldValue("district_id");
    const province = rawProvinces.find((p) => p.ID === provinceId);
    const district = province?.Districts?.find((d: any) => d.ID === districtId);
    const sub = district?.SubDistricts?.find((s: any) => s.ID === subId);

    form.setFieldsValue({
      subdistrict_id: subId,
      postcode: sub?.Postcode?.post_code || "",
      postcode_id: sub?.Postcode?.ID || null,
    });
    onChange?.();
  };

  return (
    <>
      {/* House Details Section */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <HomeOutlined style={{ color: "#1890ff" }} />
          รายละเอียดที่อยู่
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <Form.Item
            label="บ้านเลขที่"
            name="house_number"
            rules={[{ required: true, message: "กรุณากรอกบ้านเลขที่" }]}
          >
            <Input
              placeholder="เช่น 123/45"
              size="large"
              prefix={<HomeOutlined style={{ color: "#bfbfbf" }} />}
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item label="หมู่บ้าน/โครงการ" name="village">
            <Input
              placeholder="ชื่อหมู่บ้านหรือโครงการ"
              size="large"
              onChange={onChange}
            />
          </Form.Item>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px"
        }}>
          <Form.Item label="ถนน" name="street">
            <Input
              placeholder="ชื่อถนน"
              size="large"
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item label="ซอย" name="sub_street">
            <Input
              placeholder="ชื่อซอย"
              size="large"
              onChange={onChange}
            />
          </Form.Item>
        </div>
      </div>

      <Divider />

      {/* Location Section */}
      <div>
        <h4 style={{
          color: "#262626",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <EnvironmentOutlined style={{ color: "#1890ff" }} />
          ตำแหน่งที่ตั้ง
        </h4>

        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Form.Item
            label="จังหวัด"
            name="province_id"
            rules={[{ required: true, message: "กรุณาเลือกจังหวัด" }]}
          >
            <Select
              placeholder="ค้นหาและเลือกจังหวัด"
              options={provinceOptions}
              onChange={handleProvinceChange}
              loading={loading}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px"
          }}>
            <Form.Item
              label="อำเภอ/เขต"
              name="district_id"
              rules={[{ required: true, message: "กรุณาเลือกอำเภอ" }]}
            >
              <Select
                placeholder="เลือกอำเภอ"
                options={districtOptions}
                onChange={handleDistrictChange}
                disabled={!form.getFieldValue("province_id")}
                showSearch
                size="large"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label="ตำบล/แขวง"
              name="subdistrict_id"
              rules={[{ required: true, message: "กรุณาเลือกตำบล" }]}
            >
              <Select
                placeholder="เลือกตำบล"
                options={subdistrictOptions}
                onChange={handleSubdistrictChange}
                disabled={!form.getFieldValue("district_id")}
                showSearch
                size="large"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <Form.Item label="รหัสไปรษณีย์" name="postcode">
            <Input
              disabled
              placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติ"
              size="large"
              style={{
                background: "#f5f5f5",
                color: "#595959"
              }}
              onChange={onChange}
            />
          </Form.Item>

          <Form.Item name="postcode_id" hidden>
            <Input />
          </Form.Item>
        </Space>
      </div>
    </>
  );
};

export default AddressForm;
