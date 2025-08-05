import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
  Space,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  LogoutOutlined,
  EyeOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import CompanyHeader from '../../Component/CompanyHeader';
import { useNavigate } from 'react-router-dom';
import { type InternshipPostInterface } from '../../../interface/IIntershipPost';
import {
  GetJobTypes,
  GetStipends,
  GetWorkDays,
  GetWorkModes,
  GetBenefits,
  GetPostByCompanyId,
} from '../../../services/https/post';
import { GetAllProvinces, GetAllSkill } from '../../../services/https';
import type { SkillInterface } from '../../../interfaces/Skill';
import { CreatePost, GetApplicationSummary, GetCompanyByUserID } from '../../../services/https/Application';
import './post.css';

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
  const [companyId, setCompanyId] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign-in");
  };

  const realColumns = [
    {
      title: (
        <Space>
          <RiseOutlined style={{ color: '#1976d2' }} />
          <span style={{ color: '#333', fontWeight: 600 }}>ตำแหน่งงาน</span>
        </Space>
      ),
      dataIndex: 'post_name',
      key: 'post_name',
      render: (text: string, record: InternshipPostInterface) => (
        <Button
          type="link"
          onClick={() => navigate(`/post/${record.ID}`)}
          style={{
            color: '#1976d2',
            fontWeight: 500,
            fontSize: '14px',
            padding: 0,
            height: 'auto',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1565c0';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#1976d2';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: (
        <Space>
          <TeamOutlined style={{ color: '#1976d2' }} />
          <span style={{ color: '#333', fontWeight: 600 }}>จำนวนที่รับ</span>
        </Space>
      ),
      dataIndex: 'quantity', // ✅ เปลี่ยนจาก applicants → quantity
      key: 'quantity',
      align: 'center' as const,
      render: (quantity: number) => (
        <div style={{
          background: '#e3f2fd',
          padding: '6px 12px',
          borderRadius: '6px',
          fontWeight: 600,
          color: '#1565c0',
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {quantity ?? 0}
        </div>
      ),
    },

    {
      title: (
        <Space>
          <CheckCircleOutlined style={{ color: '#1976d2' }} />
          <span style={{ color: '#333', fontWeight: 600 }}>สถานะ</span>
        </Space>
      ),
      dataIndex: 'StatusPost',
      key: 'status',
      align: 'center' as const,
      render: (statusObj: { status_post: string }) => {
        const status = statusObj?.status_post;
        let color = '#1976d2';
        let bgColor = '#e3f2fd';
        let text = status;
        let icon = <CheckCircleOutlined />;

        if (status === 'Open') {
          color = '#52c41a';
          bgColor = '#f6ffed';
          text = 'เปิดรับสมัคร';
          icon = <CheckCircleOutlined />;
        } else if (status === 'Closed') {
          color = '#ff4d4f';
          bgColor = '#fff2f0';
          text = 'ปิดรับสมัคร';
          icon = <StopOutlined />;
        } else if (status === 'Pending Approval') {
          color = '#faad14';
          bgColor = '#fffbe6';
          text = 'รอตรวจสอบ';
          icon = <ClockCircleOutlined />;
        }

        return (
          <div style={{
            background: bgColor,
            color: color,
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 500,
            border: `1px solid ${color}20`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px'
          }}>
            {icon}
            {text}
          </div>
        );
      },
    },
    {
      title: (
        <Space>
          <EyeOutlined style={{ color: '#1976d2' }} />
          <span style={{ color: '#333', fontWeight: 600 }}>จัดการ</span>
        </Space>
      ),
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: InternshipPostInterface) => {
        return (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/applications/post/${record.ID}`)}
            style={{
              background: '#1976d2',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1565c0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1976d2';
            }}
          >
            ดูใบสมัคร
          </Button>
        );
      },
    }
  ];


  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await GetAllProvinces();
        const data = res.data || res;
        setRawProvinces(data);
        setProvinceOptions(
          data.map((p: any) => ({
            label: p.name_th,
            value: Number(p.ID),
          }))
        );
      } catch (error) {
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const skillsData = await GetAllSkill();
        setSkills(skillsData);
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
    const userId = Number(localStorage.getItem("id"));
    if (!userId) {
      return;
    }
    const fetchData = async () => {
      try {

        const userId = Number(localStorage.getItem("id"));

        if (!userId) return;

        const res = await GetCompanyByUserID(userId);
        const company_id = res?.ID;

        if (!company_id) return;

        setCompanyId(company_id); // เซ็ตค่า companyId

        const [postRes, applicationRes] = await Promise.all([
          GetPostByCompanyId(Number(company_id)),
          GetApplicationSummary(Number(company_id)),
        ]);

        let applications = applicationRes?.data || [];

        if (!Array.isArray(applications)) {
          applications = [applications];
        }

        const postsWithApplicantCount = postRes?.data.map((post: any) => {
          const count = applications.filter((a: any) => a.IntershipPostID === post.ID).length;
          return {
            ...post,
            applicants: count,
          };
        });

        setPosts(postsWithApplicantCount);
      } catch (error) {
        setPosts([]);
      }
    };
    fetchData();

    GetJobTypes().then(res => setJobTypes(res || []));
    GetStipends().then(res => setStipends(res || []));
    GetWorkDays().then(res => setWorkDays(res || []));
    GetWorkModes().then(res => setWorkModes(res || []));
    GetBenefits().then(res => setBenefits(res || []));
  }, []);

  const handleAddPost = async (values: any) => {

    const userId = localStorage.getItem("id");
    if (!userId) {
      message.error("ไม่พบ Company ID กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    values.StatusPostID = 3;
    values.CompanyID = Number(companyId);

    const selectedProvince = rawProvinces.find(p => p.name_th === values.province);
    const selectedDistrict = selectedProvince?.Districts?.find(d => d.name_th === values.district);
    const selectedSubdistrict = selectedDistrict?.SubDistricts?.find(s => s.ID === values.subdistrict_id);

    values.province = selectedProvince?.name_th;
    values.district = selectedDistrict?.name_th;
    values.subdistrict = selectedSubdistrict?.name_th;
    values.post_code = selectedSubdistrict?.Postcode?.post_code;

    try {
      const response = await CreatePost(values);
      if (response.status >= 200 && response.status < 300) {
        message.success("โพสต์งานใหม่ถูกบันทึกสำเร็จ!");
        form.resetFields();
        setIsAddModalVisible(false);

        const [postRes, applicationRes] = await Promise.all([
          GetPostByCompanyId(Number(companyId)),
          GetApplicationSummary(Number(companyId)),
        ]);
        const applications = applicationRes?.data || [];
        const postsWithApplicantCount = postRes?.data.map((post: any) => {
          const count = applications.filter((a: any) => a.IntershipPostID === post.ID).length;
          return {
            ...post,
            applicants: count,
          };
        });

        setPosts(postsWithApplicantCount);
      } else {
        message.error("เกิดข้อผิดพลาดในการบันทึกโพสต์งาน");
      }
    } catch (error) {
      message.error("ไม่สามารถบันทึกโพสต์งานได้");
    }
  };

  const handleProvinceChange = (provinceId: number) => {
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
    form.setFieldsValue({
      district: districtId,
      subdistrict: undefined,
      post_code: undefined,
    });

    setSelectedDistrictId(districtId);
    setSubdistrictOptions([]);

    const selectedProvince = rawProvinces.find((p) => Number(p.ID) === selectedProvinceId);
    const selectedDistrict = selectedProvince?.Districts?.find((d: any) => Number(d.ID) === districtId);
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
    const selectedProvince = rawProvinces.find((p) => Number(p.ID) === selectedProvinceId);
    const selectedDistrict = selectedProvince?.Districts?.find((d: any) => d.ID === selectedDistrictId);
    const selectedSubdistrict = selectedDistrict?.SubDistricts?.find((s: any) => s.ID === subdistrictId);
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
    <Layout style={{
      minHeight: '100vh',
      background: '#f8fafb'
    }}>
      <CompanyHeader />
      <Header style={{
        background: '#e3f2fd',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e0e7ff'
      }}>
        <Title level={2} style={{
          margin: 0,
          color: '#1565c0',
          fontWeight: 600,
          fontSize: '24px'
        }}>
          Company Dashboard
        </Title>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            borderRadius: '8px',
            fontWeight: 500,
            height: '40px',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 77, 79, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 77, 79, 0.3)';
          }}
        >
          Logout
        </Button>
      </Header>

      <Content style={{ margin: '24px', minHeight: 'calc(100vh - 200px)' }}>
        <Card
          style={{
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e3f2fd',
            background: '#ffffff'
          }}
          title={
            <div style={{
              background: '#e3f2fd',
              margin: '-24px -24px 24px -24px',
              padding: '16px 24px',
              borderRadius: '8px 8px 0 0',
              color: '#1565c0',
              fontSize: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
              width: '1260px',
            }}>
              <RiseOutlined style={{ fontSize: '24px' }} />
              ตำแหน่งงานที่โพสต์ไว้
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              style={{
                background: '#1976d2',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                height: '36px',
                paddingLeft: '16px',
                paddingRight: '16px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1976d2';
              }}
            >
              เพิ่มโพสต์
            </Button>
          }
          bodyStyle={{ padding: '0' }}
        >
          <Table
            dataSource={posts}
            columns={realColumns}
            rowKey="id"
            pagination={false}
            className="custom-table"
            rowClassName={(_record, index) =>
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
          />
        </Card>
      </Content>

      <Modal
        title={
          <div style={{
            background: '#e3f2fd',
            margin: '-24px -24px 24px -24px',
            padding: '16px 24px',
            color: '#1565c0',
            fontSize: '18px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <PlusOutlined style={{ fontSize: '20px' }} />
            เพิ่มโพสต์งานใหม่
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
        styles={{
          body: {
            background: '#ffffff',
            borderRadius: '0 0 8px 8px'
          }
        }}
      >
        <Form
          form={form}
          onFinish={handleAddPost}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            label={<span style={{ color: '#333', fontWeight: 600 }}>หัวข้อหรือตำแหน่งที่เปิดรับ</span>}
            name="post_name"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้อหรือตำแหน่งที่เปิดรับ' }]}
          >
            <Input
              style={{
                borderRadius: '6px',
                border: '1px solid #e0e7ff',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e7ff';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: '#333', fontWeight: 600 }}>จำนวนที่รับ</span>}
            name="quantity"
            rules={[
              { required: true, message: 'กรุณากรอกจำนวนที่รับ' },
              {
                type: 'number',
                min: 1,
                message: 'จำนวนต้องมากกว่าหรือเท่ากับ 1',
              },
            ]}
          >
            <InputNumber
              style={{
                width: '100%',
                borderRadius: '6px',
              }}
              min={1}
              precision={0} // 👈 ไม่ให้กรอกทศนิยม
            />
          </Form.Item>


          <Form.Item
            label={<span style={{ color: '#333', fontWeight: 600 }}>รายละเอียดงาน</span>}
            name="post_description"
            rules={[{ required: true, message: 'กรุณากรอกรายละเอียดงาน' }]}
          >
            <Input.TextArea
              rows={4}
              style={{
                borderRadius: '6px',
                resize: 'none'
              }}
            />
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

          {contextHolder}

          <Form.Item
            label={<span style={{ color: '#333', fontWeight: 600 }}>สวัสดิการ</span>}
            name="benefit_ids"
            rules={[{ required: true, message: 'กรุณาเลือกสวัสดิการอย่างน้อย 1 รายการ' }]}
          >
            <Select
              mode="multiple"
              placeholder="เลือกสวัสดิการ"
              allowClear
              style={{
                borderRadius: '6px'
              }}
            >
              {benefits.map(b => (
                <Select.Option key={b.ID} value={b.ID}>
                  {b.benefit}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#333', fontWeight: 600 }}>GPA ขั้นต่ำ</span>}
                name="min_gpa"
                rules={[{ required: true, message: "กรุณากรอกเกรดเฉลี่ยขั้นต่ำ" },
                {
                  validator: (_, value) => {
                    if (value >= 0 && value <= 4) {
                      return Promise.resolve();
                    }
                    return Promise.reject("เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 ถึง 4.00");
                  },
                },]}
              >
                <InputNumber
                  min={0}
                  max={4}
                  step={0.01}
                  style={{
                    width: '100%',
                    borderRadius: '6px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#333', fontWeight: 600 }}>ประเภทงาน</span>}
                name="JobTypeID"
                rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}
              >
                <Select placeholder="เลือกประเภทงาน">
                  {jobTypes.map(j => (
                    <Select.Option key={j.ID} value={j.ID}>{j.job_type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>ค่าตอบแทน</span>}
                name="StipendID"
                rules={[{ required: true, message: 'กรุณาเลือกค่าตอบแทน' }]}
              >
                <Select placeholder="เลือกค่าตอบแทน">
                  {stipends.map(s => (
                    <Select.Option key={s.ID} value={s.ID}>{s.stipend}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>วันทำงาน</span>}
                name="WorkDayID"
                rules={[{ required: true, message: 'กรุณาเลือกวันทำงาน' }]}
              >
                <Select placeholder="เลือกวันทำงาน">
                  {workDays.map(w => (
                    <Select.Option key={w.ID} value={w.ID}>{w.work_day}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>รูปแบบการทำงาน</span>}
            name="WorkModeID"
            rules={[{ required: true, message: 'กรุณาเลือกรูปแบบการทำงาน' }]}
          >
            <Select placeholder="เลือกรูปแบบการทำงาน">
              {workModes.map(w => (
                <Select.Option key={w.ID} value={w.ID}>{w.work_mode}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider style={{
            borderColor: '#e0e7ff',
            margin: '24px 0 20px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: '#333'
          }}>
            📍 ที่ตั้งสถานประกอบการ
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#333', fontWeight: 600 }}>จังหวัด</span>}
                name="province"
                rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}
              >
                <Select
                  showSearch
                  options={provinceOptions}
                  onChange={handleProvinceChange}
                  placeholder="เลือกจังหวัด"
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: '6px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>อำเภอ / เขต</span>}
                name="district"
                rules={[{ required: true, message: 'กรุณาเลือกอำเภอ/เขต' }]}
              >
                <Select
                  showSearch
                  options={districtOptions}
                  onChange={handleDistrictChange}
                  placeholder="เลือกอำเภอ / เขต"
                  disabled={!districtOptions.length}
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>ตำบล / แขวง</span>}
                name="subdistrict_id"
                rules={[{ required: true, message: 'กรุณาเลือกตำบล/แขวง' }]}
              >
                <Select
                  showSearch
                  options={subdistrictOptions}
                  onChange={handleSubdistrictChange}
                  placeholder="เลือกตำบล / แขวง"
                  disabled={!subdistrictOptions.length}
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#2c5aa0', fontWeight: 600 }}>รหัสไปรษณีย์</span>}
                name="post_code"
                rules={[{ required: true, message: 'กรุณาเลือกรหัสไปรษณีย์' }]}
              >
                <Select
                  disabled={!selectedSubdistrict?.Postcode}
                  options={selectedSubdistrict?.Postcode ?
                    [{
                      label: selectedSubdistrict.Postcode.post_code,
                      value: selectedSubdistrict.Postcode.ID
                    }] : []
                  }
                  placeholder="เลือกรหัสไปรษณีย์"
                  style={{
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0 24px 0' }} />

          <Form.Item style={{ marginBottom: 0 }}>
            <Row justify="center" gutter={16}>
              <Col span={8}>
                <Button
                  onClick={() => setIsAddModalVisible(false)}
                  block
                  style={{
                    height: '45px',
                    borderRadius: '10px',
                    fontWeight: 500,
                    fontSize: '15px',
                    border: '2px solid #e8f4ff',
                    color: '#2c5aa0',
                    background: 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#87ceeb';
                    e.currentTarget.style.color = '#87ceeb';
                    e.currentTarget.style.background = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8f4ff';
                    e.currentTarget.style.color = '#2c5aa0';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  ยกเลิก
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  style={{
                    height: '45px',
                    background: 'linear-gradient(135deg, #87ceeb 0%, #5fb3d4 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '15px',
                    boxShadow: '0 4px 16px rgba(135, 206, 235, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(135, 206, 235, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(135, 206, 235, 0.4)';
                  }}
                >
                  โพสต์งาน
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CompanyDashboard;