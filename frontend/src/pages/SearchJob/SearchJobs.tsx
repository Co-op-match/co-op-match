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
import CoopMatchHeaderDefault from '../Component/CoopMatchHeader';
import type { BenefitInterface } from '../../interfaces/Benefit';
import type { JobTypeInterface } from '../../interfaces/JobType';
import type { StipendInterface } from '../../interfaces/Stipend';
import type { WorkDayInterface } from '../../interfaces/WorkDay';
import type { WorkModeInterface } from '../../interfaces/WorkMode';
import type { IntershipPostInterface } from '../../interfaces/IntershipPost';
import {
  GetAllProvinces,
  GetBenefit,
  GetJobtype,
  GetStipends,
  GetWorkDay,
  GetWorkMode,
  GetIntershipPost
} from '../../services/https';
import { useNavigate } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface SelectOption {
  label: string;
  value: number;
}

// Type definitions for filter state
interface FilterState {
  jobType?: number;
  province?: number;
  workMode?: number;
  workDay?: number;
  stipend?: number;
  benefits: string[];
}

// Configuration for work mode colors
const WORK_MODE_COLORS = {
  Remote: '#722ed1',
  'On-site': '#73d13d',
  Hybrid: '#ff7875',
  default: '#d9d9d9'
} as const;

const SearchJobs: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<SelectOption[]>([]);

  // Master data states
  const [jobType, setJobType] = useState<JobTypeInterface[]>([]);
  const [stipend, setStipend] = useState<StipendInterface[]>([]);
  const [workDay, setWorkDay] = useState<WorkDayInterface[]>([]);
  const [workMode, setWorkMode] = useState<WorkModeInterface[]>([]);
  const [benefit, setBenefit] = useState<BenefitInterface[]>([]);
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [rawProvinces, setRawProvinces] = useState<any[]>([]);

  // Filter states (consolidated)
  const [filters, setFilters] = useState<FilterState>({
    benefits: []
  });

  const [filteredPosts, setFilteredPosts] = useState<IntershipPostInterface[]>([]);

  // Generic function to update filter state
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Fetch initial data with better error handling
  const fetchInitialData = async () => {
    try {
      const [
        benefitRes,
        jobtypeRes,
        stipendRes,
        workdayRes,
        workmodeRes,
        postRes
      ] = await Promise.all([
        GetBenefit(),
        GetJobtype(),
        GetStipends(),
        GetWorkDay(),
        GetWorkMode(),
        GetIntershipPost(),
      ]);

      // Use a more concise way to handle responses
      const responses = [
        { res: benefitRes, setter: setBenefit },
        { res: jobtypeRes, setter: setJobType },
        { res: stipendRes, setter: setStipend },
        { res: workdayRes, setter: setWorkDay },
        { res: workmodeRes, setter: setWorkMode },
        { res: postRes, setter: setPosts }
      ];

      responses.forEach(({ res, setter }) => {
        if (res.status === 200) {
          setter(res.data);
        }
      });

    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Error fetching initial data",
      });
      setTimeout(() => navigate("/"), 2000);
    }
  };

  // Load provinces data
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
      console.error('โหลดจังหวัดล้มเหลว:', error);
    }
  };

  // Filter function with better organization
  const filterPosts = () => {
    let filtered = posts;

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.post_name?.toLowerCase().includes(searchLower) ||
        post.Company?.company_name?.toLowerCase().includes(searchLower) ||
        post.post_description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply individual filters
    const filterMappings = [
      { value: filters.jobType, field: 'JobTypeID' },
      { value: filters.workMode, field: 'WorkModeID' },
      { value: filters.workDay, field: 'WorkDayID' },
      { value: filters.stipend, field: 'StipendID' }
    ];

    filterMappings.forEach(({ value, field }) => {
      if (value) {
        filtered = filtered.filter(post => post[field as keyof IntershipPostInterface] === value);
      }
    });

    // Benefits filter
    if (filters.benefits.length > 0) {
      filtered = filtered.filter(post => {
        if (post.Benefits && Array.isArray(post.Benefits)) {
          return filters.benefits.some((benefitLabel) =>
            post.Benefits.some((benefit: { benefit: string }) => benefit.benefit === benefitLabel)
          );
        }
        return false;
      });
    }

    setFilteredPosts(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ benefits: [] });
  };

  // Get work mode color
  const getWorkModeColor = (workMode?: string) => {
    if (!workMode) return WORK_MODE_COLORS.default;
    return WORK_MODE_COLORS[workMode as keyof typeof WORK_MODE_COLORS] || WORK_MODE_COLORS.default;
  };

  // Reusable Select component for filters
  const FilterSelect: React.FC<{
    label: string;
    value: any;
    onChange: (value: any) => void;
    options: any[];
    optionLabelKey: string;
    optionValueKey: string;
    placeholder: string;
    showSearch?: boolean;
  }> = ({ label, value, onChange, options, optionLabelKey, optionValueKey, placeholder, showSearch = false }) => (
    <div style={{ marginTop: 10 }}>
      <Text strong>{label}</Text>
      <Select
        value={value}
        onChange={onChange}
        allowClear
        placeholder={placeholder}
        style={{ width: '100%', marginTop: 8 }}
        showSearch={showSearch}
        filterOption={showSearch ? (input, option) =>
          (option?.label as string).toLowerCase().includes(input.toLowerCase()) : undefined
        }
      >
        {options.map((item) => (
          <Select.Option value={item[optionValueKey]} key={item[optionValueKey]}>
            {item[optionLabelKey]}
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  // Job card component
  const JobCard: React.FC<{ job: IntershipPostInterface }> = ({ job }) => {
    const navigate = useNavigate();

    return (
      <Card
        hoverable
        style={{ borderRadius: 10 }}
        cover={
          <div
            style={{
              height: 120,
              background: 'linear-gradient(to right, #002c8c, #0057d8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={job.Company?.logo || '/logo.png'}
              alt={job.Company?.company_name}
              style={{ height: '80px', objectFit: 'contain' }}
            />
          </div>
        }
        actions={[
          <Button type="primary" onClick={() => navigate(`/post-detail/${job.ID}`)}>
            ดูรายละเอียด
          </Button>,
        ]}
      >
        <Card.Meta
          title={
            <div>
              <Text strong style={{ fontSize: '18px' }}>
                {job.post_name}
              </Text>
              <br />
              <Tag
                color="#2db7f5"
                style={{ marginTop: 4, fontWeight: 'bold', color: 'white' }}
              >
                {job.WorkMode?.work_mode || 'ไม่ระบุ'}
              </Tag>
            </div>
          }
          description={
            <>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                <Text>{[
                  job.location_detail,
                  job.subdistrict,
                  job.district,
                  job.province,
                ]
                  .filter(Boolean)
                  .join(' / ')}</Text>
              </div>
              <Space>
                <CalendarOutlined />
                <Text style={{ color: '#434343' }}>วันทำงาน: {job.WorkDay?.work_day}</Text>
              </Space>
              <br />
              <Space>
                <UserOutlined />
                <Text style={{ color: '#434343' }}>
                  จำนวนรับสมัคร: {job.quantity} อัตรา
                </Text>
              </Space>
              <br />
              <Space>
                <DollarOutlined />
                <Text style={{ color: '#434343' }}>
                  เบี้ยเลี้ยง: {job.Stipend?.stipend}
                </Text>
              </Space>
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8 }}>
                {job.post_description}
              </Paragraph>
            </>
          }
        />
      </Card>
    );
  };

  // Effects
  useEffect(() => {
    fetchInitialData();
    loadProvinces();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, filters]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <CoopMatchHeaderDefault />

      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>ตัวกรองค้นหา</Title>
              <Button
                size="small"
                onClick={clearFilters}
                style={{
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                ล้างทั้งหมด
              </Button>
            </div>

            <FilterSelect
              label="หมวดหมู่งาน"
              value={filters.jobType}
              onChange={(value) => updateFilter('jobType', value)}
              options={jobType}
              optionLabelKey="job_type"
              optionValueKey="ID"
              placeholder="เลือกหมวดหมู่งาน"
            />

            <FilterSelect
              label="จังหวัด"
              value={filters.province}
              onChange={(value) => updateFilter('province', value)}
              options={provinceOptions}
              optionLabelKey="label"
              optionValueKey="value"
              placeholder="เช่น กรุงเทพมหานคร"
              showSearch={true}
            />

            <FilterSelect
              label="สถานที่ปฏิบัติงาน"
              value={filters.workMode}
              onChange={(value) => updateFilter('workMode', value)}
              options={workMode}
              optionLabelKey="work_mode"
              optionValueKey="ID"
              placeholder="เลือกประเภทงาน"
            />

            <FilterSelect
              label="จำนวนวันฝึกงาน"
              value={filters.workDay}
              onChange={(value) => updateFilter('workDay', value)}
              options={workDay}
              optionLabelKey="work_day"
              optionValueKey="ID"
              placeholder="กำหนด"
            />

            <FilterSelect
              label="เงินเดือน/เบี้ยเลี้ยง"
              value={filters.stipend}
              onChange={(value) => updateFilter('stipend', value)}
              options={stipend}
              optionLabelKey="stipend"
              optionValueKey="ID"
              placeholder="กำหนด"
            />

            <div style={{ marginTop: 10 }}>
              <Text strong>สวัสดิการ</Text>
              <div style={{ marginTop: 8 }}>
                <Checkbox.Group
                  value={filters.benefits}
                  onChange={(checkedValues) => updateFilter('benefits', checkedValues as string[])}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  {benefit.map((item) => (
                    <div key={item.ID} style={{ marginBottom: 8 }}>
                      <Checkbox value={item.benefit}>{item.benefit}</Checkbox>
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
                  มีฝึกงาน {filteredPosts.length.toLocaleString()} ตำแหน่ง
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
            {filteredPosts.map((job) => (
              <Col xs={24} sm={12} lg={8} key={job.ID}>
                <JobCard job={job} />
              </Col>
            ))}
          </Row>

          {filteredPosts.length === 0 && (
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