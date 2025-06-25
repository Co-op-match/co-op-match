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
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import CoopMatchHeader from '../Component/CoopMatchHeader';
import type { ProvinceInterface } from '../../interfaces/Province';
import type { BenefitInterface } from '../../interfaces/Benefit';
import type { JobTypeInterface } from '../../interfaces/JobType';
import type { StipendInterface } from '../../interfaces/Stipend';
import type { WorkDayInterface } from '../../interfaces/WorkDay';
import type { WorkModeInterface } from '../../interfaces/WorkMode';

import { GetProvince, GetBenefit,GetJobtype,GetStipends,GetWorkDay,GetWorkMode } from '../../services/https';
import { useNavigate } from 'react-router-dom';
const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// Job Interface
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: 'WFH' | 'OFFICE' | 'HYBRID';
  duration: string;
  salary: string;
  description: string;
  tags: string[];
}

// Mock Data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'IT Support',
    company: 'บริษัท ABC จำกัด',
    location: 'กรุงเทพ - พระนคร',
    workType: 'WFH',
    duration: '10 สัปดาห์',
    salary: '500',
    description: 'รับสมัครนักศึกษาฝึกงานด้าน IT Support',
    tags: ['IT', 'Support', 'Entry Level']
  },
  {
    id: '2',
    title: 'Web Developer',
    company: 'บริษัท XYZ จำกัด',
    location: 'กรุงเทพ - สาทร',
    workType: 'OFFICE',
    duration: '12 สัปดาห์',
    salary: '600',
    description: 'พัฒนาเว็บไซต์และแอปพลิเคชัน',
    tags: ['Programming', 'Web', 'React']
  },
  {
    id: '3',
    title: 'Digital Marketing',
    company: 'บริษัท DEF จำกัด',
    location: 'กรุงเทพ - อโศก',
    workType: 'HYBRID',
    duration: '8 สัปดาห์',
    salary: '450',
    description: 'วางแผนและดำเนินการตลาดดิจิทัล',
    tags: ['Marketing', 'Digital', 'Social Media']
  },
  {
    id: '4',
    title: 'Graphic Designer',
    company: 'บริษัท GHI จำกัด',
    location: 'กรุงเทพ - สีลม',
    workType: 'WFH',
    duration: '16 สัปดาห์',
    salary: '550',
    description: 'ออกแบบกราฟิกและสื่อสิ่งพิมพ์',
    tags: ['Design', 'Creative', 'Adobe']
  }
];

const SearchJobs: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [jobs] = useState<Job[]>(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');

  const [province, setGetProvince] = useState<ProvinceInterface[]>([]);
  const [jobType, setGetJobType] = useState<JobTypeInterface[]>([]);
  const [stipend, setGetStipends] = useState<StipendInterface[]>([]);
  const [workDay, setGetWorkDays] = useState<WorkDayInterface[]>([]);
  const [workMode, setGetWorkModes] = useState<WorkModeInterface[]>([]);
  const [benefit, setGetBenefits] = useState<BenefitInterface[]>([]);


  // Fetch Initial Data
  const fetchInitialData = async () => {
    try {
      const [provinceRes, benefitRes, jobtypeRes, stipendRes, workdayRes, workmodeRes] = await Promise.all([
        GetProvince(),
        GetBenefit(),
        GetJobtype(),
        GetStipends(),
        GetWorkDay(),
        GetWorkMode(),
      ]);

      if (provinceRes.status === 200) setGetProvince(provinceRes.data);
      if (benefitRes.status === 200) setGetBenefits(benefitRes.data);
      if (jobtypeRes.status === 200) setGetJobType(jobtypeRes.data);
      if (stipendRes.status === 200) setGetStipends(stipendRes.data);
      if (workdayRes.status === 200) setGetWorkDays(workdayRes.data);
      if (workmodeRes.status === 200) setGetWorkModes(workmodeRes.data);

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
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProvince) {
      filtered = filtered.filter(job => job.location.includes(selectedProvince));
    }

    if (selectedWorkType) {
      filtered = filtered.filter(job => job.workType === selectedWorkType);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, selectedProvince, selectedWorkType, jobs]);

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'WFH': return 'blue';
      case 'OFFICE': return 'green';
      case 'HYBRID': return 'orange';
      default: return 'default';
    }
  };

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
                  มีฝึกงาน {filteredJobs.length.toLocaleString()} ตำแหน่ง
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
            {filteredJobs.map((job) => (
              <Col xs={24} sm={12} lg={8} key={job.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  cover={
                    <div style={{
                      height: 120,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Avatar size={64} style={{ backgroundColor: '#1890ff' }}>
                        {job.company.charAt(0)}
                      </Avatar>
                    </div>
                  }
                  actions={[
                    <Button type="primary" key="apply">สมัครงาน</Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <div>
                        <Text strong style={{ fontSize: '18px' }}>{job.title}</Text><br />
                        <Tag color={getWorkTypeColor(job.workType)} style={{ marginTop: 4 }}>
                          {job.workType}
                        </Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text>{job.company}</Text>
                        <Space>
                          <EnvironmentOutlined />
                          <Text>{job.location}</Text>
                        </Space>
                        <Space>
                          <CalendarOutlined />
                          <Text>ระยะเวลา: {job.duration}</Text>
                        </Space>
                        <Space>
                          <DollarOutlined />
                          <Text>เงินเดือน: {job.salary} บาท</Text>
                        </Space>
                        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                          {job.description}
                        </Paragraph>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {filteredJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                ไม่พบตำแหน่งงานที่ตรงกับเงื่อนไขการค้นหา
              </Text>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SearchJobs;
