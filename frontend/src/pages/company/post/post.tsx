import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
} from 'antd';
import CompanyHeader from '../../Component/CompanyHeader';
import { useNavigate } from 'react-router-dom';
import { GetPostByCompanyId } from '../../../services/https/post';
import { type InternshipPostInterface } from '../../../interface/IIntershipPost';
import {
  GetJobTypes,
  GetStipends,
  GetWorkDays,
  GetWorkModes,
  GetBenefits,
} from '../../../services/https/post';
import axios from 'axios';
import { GetAllProvinces, GetAllSkill } from '../../../services/https';
import type { SkillInterface } from '../../../interfaces/Skill';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SubDistrict {
  ID: number;
  name_th: string;
  Postcode?: {
    ID: number;
    post_code: string;
  };
}

interface District {
  ID: number;
  name_th: string;
  SubDistricts: SubDistrict[];
}

interface Province {
  ID: number;
  name_th: string;
  Districts: District[];
}



const { Header, Content } = Layout;
const { Title } = Typography;

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<InternshipPostInterface[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [stipends, setStipends] = useState<any[]>([]);
  const [workDays, setWorkDays] = useState<any[]>([]);
  const [workModes, setWorkModes] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [skills, setSkills] = useState<SkillInterface[]>([]);

  const [provinceOptions, setProvinceOptions] = useState<SelectOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<SelectOption[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<SelectOption[]>([]);

  const [rawProvinces, setRawProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>();
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>();
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<SubDistrict | null>(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign-in");
  };

  const realColumns = [
    {
      title: 'ตำแหน่งงาน',
      dataIndex: 'post_name',
      key: 'post_name',
      render: (text: string, record: InternshipPostInterface) => (
        <Button type="link" onClick={() => navigate(`/post  /${record.ID}`)}>{text}</Button>
      ),
    },
    {
      title: 'จำนวนผู้สมัคร',
      dataIndex: 'applicants',
      key: 'applicants',
      render: (applicants: number) => applicants ?? 0,
    },
    {
      title: 'สถานะ',
      dataIndex: 'StatusPost',
      key: 'status',
      render: (statusObj: { status_post: string }) => {
        const status = statusObj?.status_post; // ✅ ถูกต้อง

        let color = 'default';
        let text = status;

        if (status === 'Open') {
          color = 'green';
          text = 'เปิดรับสมัคร';
        } else if (status === 'Closed') {
          color = 'red';
          text = 'ปิดรับสมัคร';
        } else if (status === 'Pending Approval') {
          color = 'orange';
          text = 'รอตรวจสอบ';
        }

        return <Tag color={color}>{text}</Tag>;
      }
      ,
    },

    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: InternshipPostInterface) => {
        console.log('record:', record); // 👈 ดู output ว่ามี id ไหม
        return (
          <Button
            type="primary"
            onClick={() => navigate(`/post/${record.ID}`)}
          >
            ดูใบสมัคร
          </Button>
        );
      },}      
  ];

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
    const fetchOptions = async () => {
      try {
        const skillsData = await GetAllSkill();

        setSkills(skillsData);

        console.log(skillsData)

      } catch {
        messageApi.error({
          content: 'โหลดข้อมูลทักษะหรือความสนใจไม่สำเร็จ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("id");
    if (companyId) {
      GetPostByCompanyId(Number(companyId)).then((res) => {
        if (Array.isArray(res?.data)) {
          // เพิ่ม mock applicants และ status
          const postsWithMock = res.data.map((post: any) => ({
            ...post,
            applicants: Math.floor(Math.random() * 10),
            status: 'เปิดรับสมัคร',
          }));
          setPosts(postsWithMock);
        } else {
          console.error("โพสต์ไม่อยู่ในรูปแบบ array:", res?.data);
          setPosts([]);
        }
      });
    }

    GetJobTypes().then(res => setJobTypes(res || []));
    GetStipends().then(res => setStipends(res || []));
    GetWorkDays().then(res => setWorkDays(res || []));
    GetWorkModes().then(res => setWorkModes(res || []));
    GetBenefits().then(res => setBenefits(res || []));

    
  }, []);

  const handleAddPost = async (values: any) => {
    const companyId = localStorage.getItem("id");
    if (!companyId) {
      message.error("ไม่พบ Company ID กรุณาเข้าสู่ระบบใหม่");
      return;
    }
  
    values.StatusPostID = 3;
    values.CompanyID = Number(companyId);
  
    // 🔁 ดึงชื่อจาก rawProvinces ก่อนส่ง
    const selectedProvince = rawProvinces.find(p => p.name_th === values.province);
    const selectedDistrict = selectedProvince?.Districts?.find(d => d.name_th === values.district);
    const selectedSubdistrict = selectedDistrict?.SubDistricts?.find(s => s.ID === values.subdistrict_id);
  
    values.province = selectedProvince?.name_th;
    values.district = selectedDistrict?.name_th;
    values.subdistrict = selectedSubdistrict?.name_th;
    values.post_code = selectedSubdistrict?.Postcode?.post_code;
  
    try {
      const response = await axios.post('http://localhost:8000/post', values);
      if (response.status >= 200 && response.status < 300) {
        message.success("โพสต์งานใหม่ถูกบันทึกสำเร็จ!");
        form.resetFields();
        setIsAddModalVisible(false);
  
        const res = await GetPostByCompanyId(Number(companyId));
        if (Array.isArray(res?.data)) {
          const postsWithMock = res.data.map((post: any) => ({
            ...post,
            applicants: Math.floor(Math.random() * 10),
          }));
          setPosts(postsWithMock);
        } else {
          setPosts([]);
          console.error("ผลลัพธ์จาก backend ไม่ใช่ array:", res?.data);
        }
      } else {
        message.error("เกิดข้อผิดพลาดในการบันทึกโพสต์งาน");
      }
    } catch (error) {
      console.error("❌ POST error:", error);
      message.error("ไม่สามารถบันทึกโพสต์งานได้");
    }
  };

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
        selectedProvince.Districts.map((d: { ID: number; name_th: string }) => ({
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
        selectedDistrict.SubDistricts.map((s: { ID: number; name_th: string }) => ({
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
      setSelectedSubdistrict(selectedSubdistrict);
  
      form.setFieldsValue({
        subdistrict: selectedSubdistrict.name_th,
        district: selectedDistrict?.name_th,
        province: selectedProvince?.name_th,
        subdistrict_id: Number(subdistrictId),
        post_code: selectedSubdistrict?.Postcode?.ID || undefined,
      });
    }
  };
  


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CompanyHeader />
      <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Company Dashboard</Title>
        <Button type="primary" danger onClick={handleLogout}>Logout</Button>
      </Header>

      <Content style={{ margin: '16px' }}>
        <Card
          title="ตำแหน่งงานที่โพสต์ไว้"
          extra={<Button type="primary" onClick={() => setIsAddModalVisible(true)}>เพิ่มโพสต์</Button>}
        >
          <Table dataSource={posts} columns={realColumns} rowKey="id" pagination={false} />
        </Card>
      </Content>

      <Modal title="เพิ่มโพสต์" open={isAddModalVisible} onCancel={() => setIsAddModalVisible(false)} footer={null} width={720}>
        <Form form={form} onFinish={handleAddPost} layout="vertical">
          <Form.Item label="หัวข้อหรือตำแหน่งที่เปิดรับ" name="post_name" rules={[{ required: true, message: 'กรุณากรอกหัวข้อหรือตำแหน่งที่เปิดรับ' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="จำนวนที่รับ" name="quantity" rules={[{ required: true, message: 'กรุณากรอกจำนวนที่รับ' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="รายละเอียดงาน" name="post_description" rules={[{ required: true, message: 'กรุณากรอกรายละเอียดงาน' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          {contextHolder}
          <Form.Item
            label="ทักษะ"
            name="skills"
            validateTrigger="onSubmit"
            rules={[{ required: true, message: 'กรุณาเลือกทักษะอย่างน้อย 1 รายการ' }]}
          >
            <Select mode="multiple" placeholder="เลือกทักษะ" allowClear>
              {skills.map(skill => (
                <Select.Option key={skill.ID} value={skill.ID}>
                  {skill.skill_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="GPA" name="min_gpa" rules={[{ required: true, message: 'กรุณากรอก GPA' }]}>
            <InputNumber min={0} max={4} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="ประเภทงาน" name="JobTypeID" rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}>
            <Select placeholder="เลือกประเภทงาน">
              {jobTypes.map(j => (
                <Select.Option key={j.ID} value={j.ID}>{j.job_type}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="ค่าตอบแทน" name="StipendID" rules={[{ required: true, message: 'กรุณาเลือกค่าตอบแทน' }]}>
            <Select placeholder="เลือกค่าตอบแทน">
              {stipends.map(s => (
                <Select.Option key={s.ID} value={s.ID}>{s.stipend}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="วันทำงาน" name="WorkDayID" rules={[{ required: true, message: 'กรุณาเลือกวันทำงาน' }]}>
            <Select placeholder="เลือกวันทำงาน">
              {workDays.map(w => (
                <Select.Option key={w.ID} value={w.ID}>{w.work_day}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="รูปแบบการทำงาน" name="WorkModeID" rules={[{ required: true, message: 'กรุณาเลือกรูปแบบการทำงาน' }]}>
            <Select placeholder="เลือกรูปแบบการทำงาน">
              {workModes.map(w => (
                <Select.Option key={w.ID} value={w.ID}>{w.work_mode}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="สวัสดิการ" name="benefit_id" rules={[{ required: true, message: 'กรุณาเลือกสวัสดิการ' }]}>
            <Select placeholder="เลือกสวัสดิการ">
              {benefits.map(b => (
                <Select.Option key={b.ID} value={b.ID}>{b.benefit}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <h3>ที่ตั้ง</h3>
          <Row gutter={16}>
            
            <Col span={12}>
              <Form.Item label="จังหวัด" name="province" rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}>
                <Select
                  showSearch
                  options={provinceOptions}
                  onChange={handleProvinceChange}
                  placeholder="เลือกจังหวัด"
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="อำเภอ / เขต" name="district" rules={[{ required: true, message: 'กรุณาเลือกอำเภอ/เขต' }]}>
                <Select
                  showSearch
                  options={districtOptions}
                  onChange={handleDistrictChange}
                  placeholder="เลือกอำเภอ / เขต"
                  disabled={!districtOptions.length}
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="ตำบล / แขวง" name="subdistrict_id" rules={[{ required: true, message: 'กรุณาเลือกตำบล/แขวง' }]}>
                <Select
                  showSearch
                  options={subdistrictOptions}
                  onChange={handleSubdistrictChange}
                  placeholder="เลือกตำบล / แขวง"
                  disabled={!subdistrictOptions.length}
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="รหัสไปรษณีย์" name="post_code" rules={[{ required: true, message: 'กรุณาเลือกรหัสไปรษณีย์' }]}>
                <Select
                  disabled={!selectedSubdistrict?.Postcode}
                  options={selectedSubdistrict?.Postcode ? [{ label: selectedSubdistrict.Postcode.post_code, value: selectedSubdistrict.Postcode.ID }] : []}
                  placeholder="เลือกรหัสไปรษณีย์"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Row justify="end" gutter={10}>
              <Col span={8}><Button onClick={() => setIsAddModalVisible(false)} block>ยกเลิก</Button></Col>
              <Col span={8}><Button type="primary" htmlType="submit" block>โพสต์</Button></Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CompanyDashboard;
