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

import { useNavigate } from 'react-router-dom';
import { GetPostByCompanyId } from '../../services/https/post';
import { type InternshipPostInterface } from '../../interface/IIntershipPost';
import {
  GetJobTypes,
  GetStipends,
  GetWorkDays,
  GetWorkModes,
  GetBenefits,
} from '../../services/https/post';
import axios from 'axios';
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
  const [provinces, setProvinces] = useState<string[]>([]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign-in");
  };

  const jobPostings = [
    { id: 1, title: 'Frontend Intern', applicants: 5, status: 'เปิดรับสมัคร' },
    { id: 2, title: 'Backend Developer', applicants: 2, status: 'ปิดรับสมัคร' },
  ];

  const columns = [
    { title: 'ตำแหน่งงาน', dataIndex: 'title', key: 'title' },
    { title: 'จำนวนผู้สมัคร', dataIndex: 'applicants', key: 'applicants' },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status === 'เปิดรับสมัคร' ? <Tag color="green">เปิดรับสมัคร</Tag> : <Tag color="red">ปิดรับสมัคร</Tag>,
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: any) => <Button type="link" onClick={() => alert(`ดูรายละเอียดงาน ${record.title}`)}>ดูรายละเอียด</Button>,
    },
  ];

  const realColumns = [
    {
      title: 'ชื่อโพสต์',
      dataIndex: 'post_name',
      key: 'post_name',
      render: (text: string, record: InternshipPostInterface) => (
        <Button type="link" style={{ color: '#3399FF' }} onClick={() => navigate(`/post-detail/${record.id}`)}>{text}</Button>
      ),
    },
    {
      title: 'บริษัท',
      dataIndex: ['Company', 'company_name'],
      key: 'company_name',
      render: (_: any, record: InternshipPostInterface) => <span>{record.Company?.company_name || '-'}</span>,
    },
    { title: 'จำนวนที่รับ', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: InternshipPostInterface) => <Button type="link" onClick={() => navigate(`/post-detail/${record.id}`)}>ดูรายละเอียด</Button>,
    },
  ];

  useEffect(() => {
    const companyId = localStorage.getItem("id");
    if (companyId) {
      GetPostByCompanyId(Number(companyId)).then((res) => {
        if (Array.isArray(res?.data)) setPosts(res.data);
        else { console.error("โพสต์ไม่อยู่ในรูปแบบ array:", res?.data); setPosts([]); }
      });
    }

    GetJobTypes().then(res => setJobTypes(res || []));
    GetStipends().then(res => setStipends(res || []));
    GetWorkDays().then(res => setWorkDays(res || []));
    GetWorkModes().then(res => setWorkModes(res || []));
    GetBenefits().then(res => setBenefits(res || []));

    axios.get('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json')
      .then(res => {
        const names = res.data.map((item: any) => item.name_th);
        setProvinces(names);
      })
      .catch(err => console.error("โหลดจังหวัดล้มเหลว", err));
  }, []);

  const handleAddPost = async (values: any) => {
    const companyId = localStorage.getItem("id");
    if (!companyId) {
      message.error("ไม่พบ Company ID กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    // 🟢 เพิ่มค่าที่ backend ต้องการ
    values.StatusPostID = 1;
    values.CompanyID = Number(companyId);

    try {
      const response = await axios.post('http://localhost:8000/post', values);
      if (response.status >= 200 && response.status < 300) {
        message.success("โพสต์งานใหม่ถูกบันทึกสำเร็จ!");
        form.resetFields();
        setIsAddModalVisible(false);

        // 🔁 โหลดโพสต์ใหม่เข้า Table
        const res = await GetPostByCompanyId(Number(companyId));
        if (Array.isArray(res?.data)) {
          setPosts(res.data);
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


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>Company Dashboard</Title>
          <Button type="primary" danger onClick={handleLogout}>Logout</Button>
        </Header>

        <Content style={{ margin: '16px' }}>
          <Card title="ตำแหน่งงานที่เปิดรับสมัคร (ตัวอย่างจำลอง)">
            <Table dataSource={jobPostings} columns={columns} rowKey="id" pagination={false} />
          </Card>

          <Card title="ตำแหน่งงานที่โพสต์ไว้ (จากระบบจริง)" extra={<Button type="primary" onClick={() => setIsAddModalVisible(true)}>เพิ่มโพสต์</Button>}>
            <Table dataSource={posts} columns={realColumns} rowKey="id" pagination={false} />
          </Card>
        </Content>
      </Layout>

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

          <Form.Item label="คุณสมบัติ" name="qualifications" rules={[{ required: true, message: 'กรุณากรอกคุณสมบัติ' }]}>
            <Input.TextArea rows={3} />
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
                <Select.Option key={b.ID} value={b.ID}>{b.benefit_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <h3>ที่ตั้ง</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="รายละเอียด" name="location_detail" rules={[{ required: true, message: 'กรุณากรอกรายละเอียดสถานที่' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="แขวง/ตำบล" name="subdistrict">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="เขต/อำเภอ" name="district">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="จังหวัด" name="province" rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}>
                <Select
                  placeholder="เลือกจังหวัด"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={provinces.map(p => ({ value: p, label: p }))}
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
