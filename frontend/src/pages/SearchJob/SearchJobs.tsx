import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Select,
  Input,
  Checkbox,
  Typography,
  Tag,
  Space,
  Avatar,
  Row,
  Col,
  Button,
  message,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import CoopMatchHeader from '../component/CoopMatchHeader';
import type { ProvinceInterface } from '../../interfaces/Province';
import type { BenefitInterface } from '../../interfaces/Benefit';
import type { JobTypeInterface } from '../../interfaces/JobType';
import type { StipendInterface } from '../../interfaces/Stipend';
import type { WorkDayInterface } from '../../interfaces/WorkDay';
import type { WorkModeInterface } from '../../interfaces/WorkMode';
import type { IntershipPostInterface } from '../../interfaces/IntershipPost';
import { GetProvince, GetBenefit,GetJobtype,GetStipends,GetWorkDay,GetWorkMode,GetIntershipPost } from '../../services/https';
import { useNavigate } from 'react-router-dom';
const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;


const SearchJobs: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');

  const [province, setGetProvince] = useState<ProvinceInterface[]>([]);
  const [jobType, setGetJobType] = useState<JobTypeInterface[]>([]);
  const [stipend, setGetStipends] = useState<StipendInterface[]>([]);
  const [workDay, setGetWorkDays] = useState<WorkDayInterface[]>([]);
  const [workMode, setGetWorkModes] = useState<WorkModeInterface[]>([]);
  const [benefit, setGetBenefits] = useState<BenefitInterface[]>([]);
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);

  // Fetch Initial Data
  const fetchInitialData = async () => {
    try {
      const [provinceRes, benefitRes, jobtypeRes, stipendRes, workdayRes, workmodeRes, postRes] = await Promise.all([
        GetProvince(),
        GetBenefit(),
        GetJobtype(),
        GetStipends(),
        GetWorkDay(),
        GetWorkMode(),
        GetIntershipPost(),
      ]);

      if (provinceRes.status === 200) setGetProvince(provinceRes.data);
      if (benefitRes.status === 200) setGetBenefits(benefitRes.data);
      if (jobtypeRes.status === 200) setGetJobType(jobtypeRes.data);
      if (stipendRes.status === 200) setGetStipends(stipendRes.data);
      if (workdayRes.status === 200) setGetWorkDays(workdayRes.data);
      if (workmodeRes.status === 200) setGetWorkModes(workmodeRes.data);
      if (postRes.status === 200) setPosts(postRes.data);


    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Error fetching initial data",
      });
      setTimeout(() => navigate("/"), 2000);
    }
  };

  useEffect(() => {
    fetchInitialData();
    

  }, );


  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <CoopMatchHeader  />

      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ marginTop: 10 }}>
              <Text strong>หมวดหมู่งาน</Text>
              <Select
                placeholder="เลือกหมวดหมู่งาน"
                style={{ width: '100%', marginTop: 8 }}
                allowClear
              >
                {jobType.map((item) => (
                    <Select.Option value={item?.ID} key={item?.ID}>
                      {item?.job_type}
                    </Select.Option>
                  ))}
              </Select>
            </div>

            <div style={{ marginTop: 10 }}>
              <Text strong>จังหวัด</Text>
              <Select
                placeholder="เช่น กรุงเทพมหานคร"
                style={{ width: '100%', marginTop: 8 }}
                allowClear
              >
                {province.map((item) => (
                    <Select.Option value={item?.ID} key={item?.ID}>
                      {item?.province}
                    </Select.Option>
                  ))}
              </Select>
            </div>

            <div style={{ marginTop: 10 }}>
              <Text strong>สถานที่ปฏิบัติงาน</Text>
              <Select
                placeholder="เลือกประเภทงาน"
                style={{ width: '100%', marginTop: 8 }}
                defaultValue={1}
                allowClear
              >
                {workMode.map((item) => (
                    <Select.Option value={item?.ID} key={item?.ID}>
                      {item?.work_mode}
                    </Select.Option>
                  ))}
              </Select>
            </div>

            <div style={{ marginTop: 10 }}>
              <Text strong>จำนวนวันฝึกงาน</Text>
              <Select
                placeholder="กำหนด"
                style={{ width: '100%', marginTop: 8 }}
                defaultValue={1}
                allowClear
              >
                {workDay.map((item) => (
                    <Select.Option value={item?.ID} key={item?.ID}>
                      {item?.work_day}
                    </Select.Option>
                  ))}
              </Select>
            </div>

            <div style={{ marginTop: 10 }}>
              <Text strong>เงินเดือน/เบี้ยเลี้ยง</Text>
              <Select
                placeholder="กำหนด"
                style={{ width: '100%', marginTop: 8 }}
                defaultValue={1}
                allowClear
              >
                {stipend.map((item) => (
                    <Select.Option value={item?.ID} key={item?.ID}>
                      {item?.stipend}
                    </Select.Option>
                  ))}
              </Select>
            </div>
            
            <div style={{ marginTop: 10 }}>
              <Text strong>สวัสดิการ</Text>
              <div style={{ marginTop: 8 }}>
                <Checkbox.Group 
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column'  // จัดเรียงในแนวตั้ง
                  }}
                >
                  {benefit.map((item) => (
                    <div key={item.ID} style={{ marginBottom: 8 }}>
                      <Checkbox value={item.ID}>{item.benefit_name}</Checkbox>
                    </div>
                  ))}
                </Checkbox.Group>
              </div>
            </div>
          </Space>
        </Sider>

        <Content style={{ padding: '24px' }}>
          <div style={{ marginBottom: 24 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Title level={4} style={{ margin: 0 }}>
                  ตัวกรองค้นหางาน
                </Title>
              </Col>
              <Col>
                <Text style={{ fontSize: '16px' }}>
                {/*  มีฝึกงาน {filteredJobs.length.toLocaleString()} ตำแหน่ง*/}
                </Text>
              </Col>
            </Row>

            <Input
              placeholder="ค้นหาตำแหน่งงาน บริษัท หรือคำอธิบาย..."
              prefix={<SearchOutlined />}
              size="large"
              style={{ marginTop: 16 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        <Row gutter={[16, 16]}>
  {posts.map((job) => (
    <Col xs={24} sm={12} lg={8} key={job.ID}>
      
      <Card
        hoverable
        style={{ height: '100%' }}
        cover={
          <div style={{
            height: 120,
            background: 'linear-gradient(to right, #002c8c, #0057d8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
             <img
        src={job.Company?.logo} // ← ใช้รูปจาก backend ที่ดึงมา
        alt={job.Company?.company_name}
        style={{ height: '80px', objectFit: 'contain' }}
      />
          </div>
        }
        actions={[
          <Button type="primary">สมัครงาน</Button>
        ]}
      >
        <Card.Meta
          title={
             <div>
              <Text strong style={{ fontSize: '18px' }}>{job.post_name}</Text><br />
            <Tag
              color={
                job.WorkMode?.work_mode === 'Remote' ? '#722ed1'     // ฟ้า
                : job.WorkMode?.work_mode === 'On-site' ? '#73d13d'  // เขียว
                : job.WorkMode?.work_mode === 'Hybrid' ? '#ff7875'      // ส้มแดง
                : job.WorkMode?.work_mode === 'ทั้งหมด' ? '#003eb3'  // ฟ้าเข้ม
                : '#d9d9d9' // default สีเทาอ่อน
              }
              style={{ marginTop: 4, fontWeight: 'bold', color: 'white' }}
            >
              {job.WorkMode?.work_mode || 'ไม่ระบุ'}
            </Tag>
            </div>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
               <Space>
                <EnvironmentOutlined />
                <Text style={{ color: '#434343' }}>{job.Company?.company_name}</Text>
              </Space>
              <Space>
                <CalendarOutlined />
                <Text style={{ color: '#434343' }}>วันทำงาน: {job.WorkDay?.work_day}</Text>
              </Space>
              <Space>
                <UserOutlined />
                <Text style={{ color: '#434343' }}>จำนวนรับสมัคร: {job.quantity} อัตรา</Text>
              </Space>
               <Space>
                <DollarOutlined />
                <Text style={{ color: '#434343' }}>เบี้ยเลี้ยง: {job.Stipend?.stipend}</Text>
              </Space>
              <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                {job.post_description}
              </Paragraph>
            </Space>
          }
        />
      </Card>
    </Col>
  ))}
</Row>


        {/* {filteredJobs.length === 0 && (8*/}
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                ไม่พบตำแหน่งงานที่ตรงกับเงื่อนไขการค้นหา
              </Text>
            </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SearchJobs;
