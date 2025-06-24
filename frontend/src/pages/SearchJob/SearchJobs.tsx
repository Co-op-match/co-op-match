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
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import CoopMatchHeader from '../Component/CoopMatchHeader';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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
  const [jobs] = useState<Job[]>(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');

  useEffect(() => {
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
            <div>
              <Text strong>หมวดหมู่งาน</Text>
              <Select
                placeholder="เลือกหมวดหมู่งาน"
                style={{ width: '100%', marginTop: 8 }}
                allowClear
              >
                <Option value="it">เทคโนโลยีสารสนเทศ</Option>
                <Option value="marketing">การตลาด</Option>
                <Option value="design">ออกแบบ</Option>
                <Option value="finance">การเงิน</Option>
              </Select>
            </div>

            <div>
              <Text strong>จังหวัด</Text>
              <Select
                placeholder="เลือก จังหวัด"
                style={{ width: '100%', marginTop: 8 }}
                value={selectedProvince}
                onChange={setSelectedProvince}
                allowClear
              >
                <Option value="กรุงเทพ">กรุงเทพมหานคร</Option>
                <Option value="เชียงใหม่">เชียงใหม่</Option>
                <Option value="ขอนแก่น">ขอนแก่น</Option>
                <Option value="ภูเก็ต">ภูเก็ต</Option>
              </Select>
            </div>

            <div>
              <Text strong>สถานที่ปฏิบัติงาน</Text>
              <Select
                placeholder="เลือกประเภทงาน"
                style={{ width: '100%', marginTop: 8 }}
                value={selectedJobType}
                onChange={setSelectedJobType}
                allowClear
              >
                <Option value="fulltime">งานประจำ</Option>
                <Option value="parttime">งานพาร์ทไทม์</Option>
                <Option value="internship">ฝึกงาน</Option>
              </Select>
            </div>

            <div>
              <Text strong>ระยะเวลาการทำงาน</Text>
              <Select
                placeholder="กำหนด"
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDuration}
                onChange={setSelectedDuration}
                allowClear
              >
                <Option value="1-3">1-3 เดือน</Option>
                <Option value="3-6">3-6 เดือน</Option>
                <Option value="6-12">6-12 เดือน</Option>
                <Option value="12+">มากกว่า 12 เดือน</Option>
              </Select>
            </div>

            <div>
              <Text strong>รูปแบบการทำงาน</Text>
              <Select
                placeholder="กำหนด"
                style={{ width: '100%', marginTop: 8 }}
                value={selectedWorkType}
                onChange={setSelectedWorkType}
                allowClear
              >
                <Option value="WFH">Work from Home</Option>
                <Option value="OFFICE">ที่สำนักงาน</Option>
                <Option value="HYBRID">แบบผสม</Option>
              </Select>
            </div>

            <div>
              <Text strong>สวัสดิการ</Text>
              <div style={{ marginTop: 8 }}>
                <Checkbox>ค่าเดินทาง</Checkbox><br />
                <Checkbox>อาหาร</Checkbox><br />
                <Checkbox>ค่าใช้จ่ายอื่น</Checkbox><br />
                <Checkbox>ที่พัก</Checkbox>
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
