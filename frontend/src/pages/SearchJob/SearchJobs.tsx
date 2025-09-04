import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Spin,
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
import { useNavigate } from 'react-router-dom';
import CoopMatchHeaderDefault from '../Component/Coop_MatchHeader';
import { TbUserFilled } from 'react-icons/tb';

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

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface SelectOption {
  label: string;
  value: number;
}

interface FilterState {
  jobType?: number;
  province?: number;
  workMode?: number;
  workDay?: number;
  stipend?: number;
  benefits: string[];
}

// Loading states
interface LoadingState {
  posts: boolean;
  filters: boolean;
  likedPosts: boolean;
}

function SearchJobs() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<SelectOption[]>([]);

  // Master data
  const [jobType, setJobType] = useState<JobTypeInterface[]>([]);
  const [stipend, setStipend] = useState<StipendInterface[]>([]);
  const [workDay, setWorkDay] = useState<WorkDayInterface[]>([]);
  const [workMode, setWorkMode] = useState<WorkModeInterface[]>([]);
  const [benefit, setBenefit] = useState<BenefitInterface[]>([]);
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const [filters, setFilters] = useState<FilterState>({ benefits: [] });
  const [filteredPosts, setFilteredPosts] = useState<IntershipPostInterface[]>([]);

  // Loading states - แยกการโหลดออกจากกัน
  const [loading, setLoading] = useState<LoadingState>({
    posts: true,
    filters: true,
    likedPosts: true,
  });

  const [likeBusyId, setLikeBusyId] = useState<number | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  //const [hasStudentProfile, setHasStudentProfile] = useState<boolean | null>(null);
  const [hasStudentProfile, setHasStudentProfile] = useState<boolean>(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => setFilters(prev => ({ ...prev, [key]: value }));

  const getStudentIdFromResponse = (res: any) => {
    const payload = res?.data ?? res;
    return payload?.ID ?? payload?.student?.ID ?? payload?.id;
  };

  // แยกการตรวจสอบ student profile ออกมา
  const checkStudentProfile = useCallback(async () => {
    const userId = Number(localStorage.getItem('id'));
    if (!userId) {
      console.log('🔍 No userId found');
      setHasStudentProfile(false);
      setStudentId(null);
      setLoading(prev => ({ ...prev, likedPosts: false }));
      return;
    }

    console.log('🔍 Checking student profile for userId:', userId);
    try {
      const studentRes = await GetStudentByUserId(userId);
      const id = getStudentIdFromResponse(studentRes);
      if (id) {
        console.log('✅ Student profile found, studentId:', id);
        setHasStudentProfile(true);
        setStudentId(Number(id));
        // โหลด liked posts ทันทีที่ได้ studentId
        fetchLikedPosts(Number(id));
      } else {
        console.log('❌ Student profile not found');
        setHasStudentProfile(false);
        setStudentId(null);
        setLoading(prev => ({ ...prev, likedPosts: false }));
      }
    } catch (err: any) {
      console.log('❌ Error checking student profile:', err);
      if (err?.response?.status === 404) {
        console.log('📝 Profile not found (404) - need to create profile');
        setHasStudentProfile(false);
        setStudentId(null);
      }
      setLoading(prev => ({ ...prev, likedPosts: false }));
    }
  }, []);

  // แยกการโหลด liked posts ออกมา
  const fetchLikedPosts = async (id: number) => {
    try {
      const res = await GetLikedPostsByStudentID(id);
      const likedData = res?.data ?? res;
      setLikedPosts(
        Array.isArray(likedData)
          ? likedData.map((item: any) => item?.IntershipPost?.ID).filter((id: number | undefined): id is number => !!id)
          : []
      );
    } catch (err) {
      console.error('Error fetching liked posts:', err);
      setLikedPosts([]);
    } finally {
      setLoading(prev => ({ ...prev, likedPosts: false }));
    }
  };

  // แยกการโหลด posts ออกมา - ให้ทำงานอิสระ
  const fetchPosts = async () => {
    try {
      const postRes = await GetIntershipPost();
      if (postRes.status === 200) {
        setPosts(postRes.data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      messageApi.open({ type: 'error', content: 'ไม่สามารถโหลดข้อมูลโพสต์ได้' });
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  // แยกการโหลดข้อมูล filters ออกมา
  const fetchFiltersData = async () => {
    try {
      const [
        benefitRes,
        jobtypeRes,
        stipendRes,
        workdayRes,
        workmodeRes,
        provinceRes,
      ] = await Promise.all([
        GetBenefit(),
        GetJobtype(),
        GetStipends(),
        GetWorkDay(),
        GetWorkMode(),
        GetAllProvinces(),
      ]);

      // Set filter data
      const responses = [
        { res: benefitRes, setter: setBenefit },
        { res: jobtypeRes, setter: setJobType },
        { res: stipendRes, setter: setStipend },
        { res: workdayRes, setter: setWorkDay },
        { res: workmodeRes, setter: setWorkMode },
      ];
      responses.forEach(({ res, setter }) => {
        if (res.status === 200) setter(res.data);
      });

      // Set provinces
      const provinceData = provinceRes.data ?? provinceRes;
      setProvinceOptions(
        provinceData.map((p: any) => ({ 
          label: p.name_th, 
          value: Number(p.ID) 
        }))
      );

    } catch (err) {
      console.error('Error fetching filters data:', err);
      messageApi.open({ type: 'error', content: 'ไม่สามารถโหลดตัวกรองได้' });
    } finally {
      setLoading(prev => ({ ...prev, filters: false }));
    }
  };

  // Filter posts - ไม่ต้องรอ likedPosts โหลดเสร็จ
  const filterPosts = useCallback(() => {
    let filtered = posts;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        post =>
          post.post_name?.toLowerCase().includes(searchLower) ||
          post.Company?.company_name?.toLowerCase().includes(searchLower) ||
          post.post_description?.toLowerCase().includes(searchLower)
      );
    }

    const filterMappings = [
      { value: filters.jobType, field: 'JobTypeID' },
      { value: filters.workMode, field: 'WorkModeID' },
      { value: filters.workDay, field: 'WorkDayID' },
      { value: filters.stipend, field: 'StipendID' },
    ];
    filterMappings.forEach(({ value, field }) => {
      if (value) filtered = filtered.filter(post => post[field as keyof IntershipPostInterface] === value);
    });

    if (filters.benefits.length > 0) {
      filtered = filtered.filter(post =>
        post.benefits?.some(b => filters.benefits.includes(b.benefit))
      );
    }

    if (filters.province) {
      filtered = filtered.filter(post => post.Company?.Address?.Province?.ID === filters.province);
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, filters]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ benefits: [] });
  };

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
        loading={loading.filters}
        filterOption={
          showSearch
            ? (input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())
            : undefined
        }
      >
        {options.map(item => (
          <Select.Option value={item[optionValueKey]} key={item[optionValueKey]}>
            {item[optionLabelKey]}
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  const handleToggleLike = async (postId: number) => {
    if (!postId || likeBusyId === postId) return;

    // ✅ ถ้ายังไม่มีโปรไฟล์ ให้เปิด modal ทันที
    if (!hasStudentProfile) {
      setSetupOpen(true);
      return;
    }

    // (มีโปรไฟล์แล้ว) แต่เกิดกรณีไม่ได้ studentId จริง ๆ
    if (!studentId) {
      messageApi.error('ไม่พบข้อมูลโปรไฟล์นักศึกษา');
      return;
    }

    setLikeBusyId(postId);
    try {
      const isLiked = likedPosts.includes(postId);
      if (isLiked) {
        await DeleteLikedPost(studentId, postId);
        setLikedPosts(prev => prev.filter(id => id !== postId));
        messageApi.info('เอาโพสต์นี้ออกจากลิสต์ละนะ');
      } else {
        await LikePost({ StudentID: studentId, IntershipPostID: postId });
        setLikedPosts(prev => [...prev, postId]);
        messageApi.success('โพสต์นี้อยู่ในลิสต์ใจเธอแล้ว 💙');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLikeBusyId(null);
    }
  };

  const JobCard: React.FC<{
    job: IntershipPostInterface;
    likedPosts: number[];
    onToggleLike: (postId: number) => void;
    likeBusyId: number | null;
  }> = ({ job, likedPosts, onToggleLike, likeBusyId }) => (
    <div style={{ position: 'relative' }}>
      {/* แสดง heart ทันที ไม่ต้องรอ liked posts โหลดเสร็จ */}
      <Tooltip
        title={
          !hasStudentProfile
            ? 'สร้างโปรไฟล์ก่อนบันทึกโพสต์'                // ✅ มาก่อนสุด
            : likeBusyId === job.ID
            ? 'กำลังบันทึก...'
            : loading.likedPosts
            ? 'กำลังโหลด...'
            : likedPosts.includes(job.ID!)
            ? 'ลบออกจากที่สนใจ'
            : 'บันทึกโพสต์นี้'
        }
      >
        <div
          //onClick={() => job.ID && likeBusyId !== job.ID && !loading.likedPosts && onToggleLike(job.ID)}
          onClick={() => job.ID && likeBusyId !== job.ID && onToggleLike(job.ID)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            cursor: likeBusyId === job.ID || loading.likedPosts ? 'not-allowed' : 'pointer',
            fontSize: 20,
            opacity: likeBusyId === job.ID || loading.likedPosts ? 0.5 : 1,
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
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/student/post-student/${job.ID}`)}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(24, 144, 255, 0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.2)';
        }}
        cover={
          <div
            style={{
              height: 140,
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <img
              src={
                job.Company?.logo?.startsWith('http')
                  ? job.Company.logo
                  : job.Company?.logo
                  ? `http://localhost:8000${job.Company.logo}`
                  : undefined
              }
              style={{ height: '100px', objectFit: 'contain' }}
              alt="Company Logo"
            />
          </div>
        }
        actions={[
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
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
              transition: 'all 0.3s ease',
            }}
          >
            สมัครฝึกงาน
          </Button>,
        ]}
      >
        <Card.Meta
          title={
            <div>
              <Text strong style={{ fontSize: '18px', color: '#0050b3' }}>{job.post_name}</Text>
              <br />
              <Tag
                color={
                  job.WorkMode?.work_mode === 'Remote' ? '#1890ff' :
                  job.WorkMode?.work_mode === 'On-site' ? '#52c41a' :
                  job.WorkMode?.work_mode === 'Hybrid' ? '#fa8c16' : '#d9d9d9'
                }
                style={{ marginTop: 4, fontWeight: 'bold', color: 'white', borderRadius: '20px' }}
              >
                {job.WorkMode?.work_mode || 'ไม่ระบุ'}
              </Tag>
            </div>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space><Text style={{ color: '#434343' }}>{job.Company?.company_name}</Text></Space>
              <Space>
                <EnvironmentOutlined style={{ color: '#0050b3' }} />
                <Text style={{ color: '#434343' }}>
                  {job.Company?.Address?.Province?.name_th} - {job.Company?.Address?.District?.name_th}
                </Text>
              </Space>
              <Space>
                <CalendarOutlined style={{ color: '#0050b3' }} />
                <Text style={{ color: '#434343' }}>วันทำงาน: {job.WorkDay?.work_day}</Text>
              </Space>
              <Space>
                <UserOutlined style={{ color: '#0050b3' }} />
                <Text style={{ color: '#434343' }}>จำนวนรับสมัคร: {job.quantity} อัตรา</Text>
              </Space>
              <Space>
                <DollarOutlined style={{ color: '#0050b3' }} />
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

  // โหลดข้อมูลแยกกัน - ไม่ต้องรอกัน
  useEffect(() => {
    // โหลดทั้งหมดพร้อมกัน แต่แยก state
    fetchPosts();
    fetchFiltersData();
    checkStudentProfile();
  }, []);

  // ถ้าต้องการให้เร็วขึ้นอีก สามารถใช้ React.lazy loading สำหรับ filters
  // หรือโหลด posts ก่อน แล้วค่อยโหลด filters ทีหลัง
  /*
  useEffect(() => {
    // โหลด posts ก่อน (ข้อมูลสำคัญที่สุด)
    fetchPosts();
    
    // รอ 100ms แล้วค่อยโหลดส่วนอื่น
    const timer = setTimeout(() => {
      fetchFiltersData();
      checkStudentProfile();
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  */

  // Filter posts ทันทีที่มีการเปลี่ยนแปลง
  useEffect(() => {
    filterPosts();
  }, [filterPosts]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <CoopMatchHeaderDefault />
      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
          {/* Filters */}
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Title level={5} style={{ margin: 0 }}>
                ตัวกรองค้นหา
                {loading.filters && <Spin size="small" style={{ marginLeft: 8 }} />}
              </Title>
              <Button
                size="small"
                onClick={clearFilters}
                style={{
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4)',
                }}
              >
                ล้างทั้งหมด
              </Button>
            </div>
            <FilterSelect
              label="หมวดหมู่งาน"
              value={filters.jobType}
              onChange={v => updateFilter('jobType', v)}
              options={jobType}
              optionLabelKey="job_type"
              optionValueKey="ID"
              placeholder="เลือกหมวดหมู่งาน"
            />
            <FilterSelect
              label="จังหวัด"
              value={filters.province}
              onChange={v => updateFilter('province', v)}
              options={provinceOptions}
              optionLabelKey="label"
              optionValueKey="value"
              placeholder="เช่น กรุงเทพมหานคร"
              showSearch
            />
            <FilterSelect
              label="สถานที่ปฏิบัติงาน"
              value={filters.workMode}
              onChange={v => updateFilter('workMode', v)}
              options={workMode}
              optionLabelKey="work_mode"
              optionValueKey="ID"
              placeholder="เลือกประเภทงาน"
            />
            <FilterSelect
              label="จำนวนวันฝึกงาน"
              value={filters.workDay}
              onChange={v => updateFilter('workDay', v)}
              options={workDay}
              optionLabelKey="work_day"
              optionValueKey="ID"
              placeholder="กำหนด"
            />
            <FilterSelect
              label="เงินเดือน/เบี้ยเลี้ยง"
              value={filters.stipend}
              onChange={v => updateFilter('stipend', v)}
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
                  onChange={(checkedValues) =>
                    updateFilter('benefits', checkedValues as string[])
                  }
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  {benefit.map((item) => (
                    <div key={item.ID} style={{ marginBottom: 8 }}>
                      <Checkbox value={item.benefit} disabled={loading.filters}>
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
                  {loading.posts && <Spin size="small" style={{ marginLeft: 8 }} />}
                </Title>
              </Col>
              <Col>
                <Text style={{ fontSize: '16px' }}>
                  มีที่ฝึกงาน {filteredPosts.length.toLocaleString()} ตำแหน่ง
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
            {loading.posts ? (
              <Col span={24} style={{ textAlign: 'center', padding: '48px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>กำลังโหลดข้อมูลโพสต์...</Text>
                </div>
              </Col>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((job) => (
                <Col xs={24} sm={12} lg={8} key={job.ID}>
                  <JobCard
                    job={job}
                    likedPosts={likedPosts}
                    onToggleLike={handleToggleLike}
                    likeBusyId={likeBusyId}
                  />
                </Col>
              ))
            ) : (
              <Col span={24} style={{ textAlign: 'center', padding: '48px 0' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  ไม่พบตำแหน่งงานที่ตรงกับเงื่อนไขการค้นหา
                </Text>
              </Col>
            )}
          </Row>
        </Content>
      </Layout>

      {/* Modal: ต้องตั้งค่าโปรไฟล์ก่อน */}
      <Modal
        open={setupOpen}
        onCancel={() => setSetupOpen(false)}
        title={
          <div style={{ display: 'flex', gap: 8 }}>
            <TbUserFilled size={20} style={{ color: '#ff4d4f' }} />
            ตั้งค่าโปรไฟล์
          </div>
        }
        okText="ไปตั้งค่า"
        cancelText="ยกเลิก"
        onOk={() => {
          setSetupOpen(false);
          navigate('/student/add-student');
        }}
        centered
        width={360}
        okButtonProps={{
          style: {
            background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: 8,
          },
        }}
      >
        <Typography.Paragraph>
          สร้างโปรไฟล์ก่อน ถึงจะบันทึกโพสต์ได้
        </Typography.Paragraph>
      </Modal>
    </Layout>
  );
}

export default SearchJobs;