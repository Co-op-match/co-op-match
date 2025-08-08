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
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  HeartFilled,
  HeartOutlined,
  SendOutlined,
} from '@ant-design/icons';
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
  GetIntershipPost,
  GetLikedPostsByStudentID,
  LikePost,
  GetStudentByUserId,
  DeleteLikedPost,
} from '../../services/https';
import { useNavigate } from 'react-router-dom';
import CoopMatchHeaderDefault from '../Component/Coop_MatchHeader';

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

function SearchJobs(){
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
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

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
// ใน filterPosts
if (filters.benefits.length > 0) {
  filtered = filtered.filter(post =>
    post.benefits?.some(b => filters.benefits.includes(b.benefit))
  );
}


    // Province filter
    if (filters.province) {
      filtered = filtered.filter(post =>
        post.Company?.Address?.Province?.ID === filters.province
      );
    }

    setFilteredPosts(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ benefits: [] });
  };

  // Get work mode color
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
  
  // 2. แก้ไข handleToggleLike function
  const handleToggleLike = async (postId: number) => {
    try {
      const userId = Number(localStorage.getItem("id"));
      if (!userId) {
        message.error("ไม่พบข้อมูลผู้ใช้");
        return;
      }
      
      // ✅ ใช้ GetStudentByUserId เพื่อให้ได้ student ID
      const studentRes = await GetStudentByUserId(userId);
      const studentId = (studentRes as any).ID;
      
      if (!studentId) {
        message.error("ไม่พบข้อมูลนักศึกษา");
        return;
      }
      
      console.log("🎯 Toggle like for post:", postId, "student:", studentId);
      
      if (likedPosts.includes(postId)) {
        // 👎 ลบ
        await DeleteLikedPost(studentId, postId);
        setLikedPosts(prev => prev.filter(id => id !== postId));
        message.info("ลบโพสต์ออกจากรายการสนใจแล้ว");
      } else {
        // 👍 เพิ่ม
        await LikePost({
          StudentID: studentId,
          IntershipPostID: postId,
        });
        
        setLikedPosts(prev => [...prev, postId]);
        message.success("เพิ่มโพสต์ในรายการสนใจแล้ว");
      }
    } catch (err) {
      console.error("❌ Error toggling like:", err);
      message.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };
  
  const [likedLoaded, setLikedLoaded] = useState(false);
  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const userId = Number(localStorage.getItem("id"));
        console.log("🔍 userId from localStorage:", userId);
        
        if (!userId) {
          console.log("❌ No userId found");
          return;
        }

        console.log("📡 Fetching student data for userId:", userId);
        const studentRes = await GetStudentByUserId(userId);
        const studentId = (studentRes as any)?.ID;

        if (!studentId) {
          console.error("❌ ไม่พบ student ID");
          return;
        }

        console.log("📡 Fetching liked posts for studentId:", studentId);
        const res = await GetLikedPostsByStudentID(studentId);
        const likedData = (res as any)?.data;

        if (Array.isArray(likedData)) {
          const ids = likedData
            .map((item: any) => {
              const id = item?.IntershipPost?.ID;
              console.log("📋 Liked post ID:", id);
              return id;
            })
            .filter((id: number | undefined): id is number => id !== undefined);

          console.log("✅ Final liked post IDs:", ids);
          setLikedPosts(ids);
        } else {
          console.warn("⚠️ likedData is not an array:", likedData);
          setLikedPosts([]);
        }

      } catch (error) {
        console.error("❌ Error fetching liked posts:", error);
        setLikedPosts([]);
      } finally {
        setLikedLoaded(true);
      }
    };

    fetchLikedPosts();
  }, []);

  // Job card component
const JobCard: React.FC<{
  job: IntershipPostInterface;
  likedPosts: number[];
  onToggleLike: (postId: number) => void;
}> = ({ job, likedPosts, onToggleLike }) => (
    <div style={{ position: 'relative' }}>
    {/* ❤️ ปุ่มหัวใจ */}
    <Tooltip title="บันทึกโพสต์นี้">
      <div
        onClick={() => job.ID && onToggleLike(job.ID)}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2,
          cursor: 'pointer',
          fontSize: 20,
          color: likedPosts.includes(job.ID!) ? '#ff4d4f' : '#d9d9d9',
        }}
      >
        {likedPosts.includes(job.ID!) ? <HeartFilled /> : <HeartOutlined />}
      </div>
    </Tooltip>
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(24, 144, 255, 0.2)',
        border: 'none',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(24, 144, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.2)';
        }}
      cover={
        <div style={{
          height: 140,
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* โลโก้บริษัท */}
          <div style={{
          }}>
            <img
              src={
                  job.Company?.logo?.startsWith('http')
                    ? job.Company.logo 
                    : job.Company?.logo
                      ? `http://localhost:8000${job.Company.logo}` 
                      : undefined
                }
              //alt={job.Company?.company_name}
              style={{
                height: '100px',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      }
      actions={[
        <Button
          type="primary"
          size="large"
           icon={<SendOutlined />} // ⬅️ เพิ่มตรงนี้
          onClick={() => navigate(`/student/post-student/${job.ID}`)}
          style={{
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            border: 'none',
            borderRadius: '25px',
            height: '40px',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '90%',
            margin: 'auto',
            color: 'white',
            boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(-2px)';
            el.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.4)';
            el.style.background = 'linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '0 4px 15px rgba(24, 144, 255, 0.3)';
            el.style.background = 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
          }}
        >
          สมัครฝึกงาน
        </Button>
      ]}
    >
      
      <Card.Meta
        title={
          <div>
            <Text strong style={{ fontSize: '18px', color: '#0050b3' }}>{job.post_name}</Text><br />
            <Tag 
              color={job.WorkMode?.work_mode === 'Remote' ? '#1890ff' :
                    job.WorkMode?.work_mode === 'On-site' ? '#52c41a' :
                    job.WorkMode?.work_mode === 'Hybrid' ? '#fa8c16' : '#d9d9d9'}
              style={{ marginTop: 4, fontWeight: 'bold', color: 'white', borderRadius: '20px', }}
            >
              {job.WorkMode?.work_mode || 'ไม่ระบุ'}
            </Tag>
          </div>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Text style={{ color: '#434343' }}>{job.Company?.company_name}</Text>
            </Space>
            <Space>
            <EnvironmentOutlined style={{ color: '#0050b3' }} />
              <Text style={{ color: '#434343' }}>{job.Company?.Address?.Province?.name_th}</Text>
            </Space>
            <Space>
              <CalendarOutlined style={{ color: '#0050b3' }}/>
              <Text style={{ color: '#434343' }}>วันทำงาน: {job.WorkDay?.work_day}</Text>
            </Space>
            <Space>
              <UserOutlined style={{ color: '#0050b3' }}/>
              <Text style={{ color: '#434343' }}>จำนวนรับสมัคร: {job.quantity} อัตรา</Text>
            </Space>
            <Space>
              <DollarOutlined style={{ color: '#0050b3' }}/>
              <Text style={{ color: '#434343' }}>เบี้ยเลี้ยง: {job.Stipend?.stipend}</Text>
            </Space>
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8 }}>
              {job.post_description}
            </Paragraph>
          </Space>
        }
      />
    </Card>
      </div>
  );

  // Effects
  useEffect(() => {
    fetchInitialData();
    loadProvinces();
  }, []);

  // แก้ไข useEffect ที่ filter posts ให้รอ liked posts โหลดเสร็จก่อน
  useEffect(() => {
    if (likedLoaded) { // ✅ รอให้ liked posts โหลดเสร็จก่อน
      filterPosts();
    }
  }, [posts, searchTerm, filters, likedLoaded]); // เพิ่ม likedLoaded เป็น dependency

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
                  onChange={(checkedValues) => {
                    updateFilter('benefits', checkedValues as string[]);
                  }}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  {benefit.map((item) => (
                    <div key={item.ID} style={{ marginBottom: 8 }}>
                      <Checkbox value={item.benefit}>
                        {item.benefit}
                      </Checkbox>
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
            {likedLoaded ? (
              filteredPosts.map((job) => (
                <Col xs={24} sm={12} lg={8} key={job.ID}>
                  <JobCard 
                    job={job} 
                    likedPosts={likedPosts} 
                    onToggleLike={handleToggleLike}
                  />
                </Col>
              ))
            ) : (
              // แสดง loading หรือ skeleton ระหว่างโหลด
              <Col span={24} style={{ textAlign: 'center', padding: '48px 0' }}>
                <Text>กำลังโหลดข้อมูล...</Text>
              </Col>
            )}
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