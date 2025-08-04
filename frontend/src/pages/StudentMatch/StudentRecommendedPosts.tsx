
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Col, 
  Row, 
  Typography, 
  Tag, 
  Spin, 
  Empty, 
  Progress, 
  Button, 
  Modal, 
  List, 
  Statistic, 
  Badge, 
  Tooltip, 
  Slider,
  Space,
  Alert,
  Divider,
  Layout
} from 'antd';
import { 
  TrophyOutlined, 
  BulbOutlined, 
  EnvironmentOutlined, 
  BookOutlined, 
  UserOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons';
import { GetRecommendedPosts,GetStudentByUserId } from '../../services/https';
import CoopMatchHeaderDefault from '../Component/CompanyHeader';
const { Title, Text, Paragraph } = Typography;
import type { MatchResult } from '../../interfaces/MatchResult';
import type { MatchingWeights } from '../../interfaces/MatchingWeights';

function StudentRecommendedPosts() {
  const [recommendedPosts, setRecommendedPosts] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MatchResult | null>(null);
  const [weights, setWeights] = useState<MatchingWeights>({
    gpa_weight: 0.20,
    skills_weight: 0.40,
    interest_weight: 0.20,
    location_weight: 0.15,
    education_weight: 0.05
  });
  
const fetchRecommendations = async (customWeights?: MatchingWeights) => {
  setLoading(true);
  try {
    const userId = Number(localStorage.getItem("id"));
    if (!userId) {
      console.error("❌ ไม่พบ user ID");
      return;
    }

    // ✅ ใช้ student.ID (ตัวใหญ่)
    const studentRes = await GetStudentByUserId(userId);
    const studentId = (studentRes as any).ID;

    const query = customWeights
      ? `?gpa_weight=${customWeights.gpa_weight}&skills_weight=${customWeights.skills_weight}&interest_weight=${customWeights.interest_weight}&location_weight=${customWeights.location_weight}&education_weight=${customWeights.education_weight}`
      : "";

    const res = await GetRecommendedPosts(studentId, query);
    if (res?.status === 200 && res.data?.matches) {
      console.log("📦 ผลลัพธ์ที่ได้:", res.data);
      setRecommendedPosts(res.data.matches);
    } else {
      console.error("❌ Error loading recommended posts:", res?.data || res);
      setRecommendedPosts([]);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    setRecommendedPosts([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const userId = Number(localStorage.getItem("id"));
  if (!userId) return;

  async function fetchData() {
    try {
      const student = await GetStudentByUserId(userId);
      const studentId = (student as any).ID; // ✅ ใช้ ID ตัวใหญ่

      const res = await GetRecommendedPosts(studentId);
      console.log("🎯 Recommended:", res);

      if (res?.status === 200 && Array.isArray(res.data?.matches)) {
        setRecommendedPosts(res.data.matches);
      } else {
        console.warn("⚠️ res.data.matches is not valid:", res);
        setRecommendedPosts([]); // fallback
      }
    } catch (err) {
      console.error("❌ Error fetching data", err);
      setRecommendedPosts([]); // fallback
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);



  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    if (score >= 0.4) return '#fa8c16';
    return '#f5222d';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'สูง': return 'green';
      case 'ปานกลาง': return 'orange';
      case 'ต่ำ': return 'red';
      default: return 'gray';
    }
  };

  const handleWeightChange = (key: keyof MatchingWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
  };

  const applyCustomWeights = () => {
    fetchRecommendations(weights);
    setSettingsVisible(false);
  };

  const resetWeights = () => {
    const defaultWeights = {
      gpa_weight: 0.20,
      skills_weight: 0.40,
      interest_weight: 0.20,
      location_weight: 0.15,
      education_weight: 0.05
    };
    setWeights(defaultWeights);
  };

  return (
    <Layout style={{backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />

    <div style={{ marginBottom: 24, padding: '24px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
            งานที่แนะนำสำหรับคุณ
          </Title>
          <Space>
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setSettingsVisible(true)}
            >
              ปรับแต่งการแนะนำ
            </Button>
            <Button type="primary" onClick={() => fetchRecommendations()}>
              รีเฟรช
            </Button>
          </Space>
        </Space>
    {/*  </div> */}

      {!loading && recommendedPosts.length > 0 && (
        <Alert
          message="เคล็ดลับ"
          description="คะแนนความเหมาะสมคำนวณจากทักษะ, GPA, ความสนใจ, และสถานที่ คุณสามารถปรับแต่งน้ำหนักแต่ละปัจจัยได้"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 , marginTop: 16}}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>กำลังวิเคราะห์งานที่เหมาะสมกับคุณ...</div>
        </div>
      ) : Array.isArray(recommendedPosts) && recommendedPosts.length === 0 ? (
        <Empty 
          description="ไม่พบงานที่แนะนำในขณะนี้"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic
                title="งานทั้งหมด"
                value={recommendedPosts.length}
                prefix={<BookOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="งานที่เหมาะสมมาก"
                value={recommendedPosts.filter(p => p.score >= 0.8).length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<StarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="คะแนนเฉลี่ย"
                value={(recommendedPosts.reduce((sum, p) => sum + p.score, 0) / recommendedPosts.length)}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="อัปเดตล่าสุด"
                value="เมื่อสักครู่"
                prefix={<InfoCircleOutlined />}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {recommendedPosts.map((post, index) => (
              <Col key={post.post_id} xs={24} sm={12} lg={8}>
                <Badge.Ribbon text={`อันดับ ${post.ranking}`} color={index < 3 ? 'gold' : 'blue'}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => {
                          setSelectedPost(post);
                          setDetailVisible(true);
                        }}
                      >
                        ดูรายละเอียด
                      </Button>,
                      <Button type="link" icon={<HeartOutlined />}>
                        สนใจ
                      </Button>
                    ]}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                        {post.post_name}
                      </Title>
                      <Text type="secondary">{post.company_name}</Text>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Progress
                        percent={Math.round(post.score * 100)}
                        strokeColor={getScoreColor(post.score)}
                        format={(percent) => `${percent}% เหมาะสม`}
                      />
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <Tag color={getConfidenceColor(post.confidence_level)}>
                          ความมั่นใจ: {post.confidence_level}
                        </Tag>
                      </div>
                    </div>

                    <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                      <Col span={12}>
                        <Tooltip title="ทักษะที่ตรงกัน">
                          <div style={{ textAlign: 'center' }}>
                            <BulbOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                            <div>{post.matched_skills}/{post.total_required}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>ทักษะ</Text>
                          </div>
                        </Tooltip>
                      </Col>
                      <Col span={12}>
                        <Tooltip title="เกรดเฉลี่ย">
                          <div style={{ textAlign: 'center' }}>
                            <TrophyOutlined style={{ color: post.gpa_matched ? '#52c41a' : '#f5222d', fontSize: 16 }} />
                            <div>{post.gpa.toFixed(2)}/{post.min_gpa.toFixed(2)}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>GPA</Text>
                          </div>
                        </Tooltip>
                      </Col>
                    </Row>

                    <div style={{ marginBottom: 12 }}>
                      <Space wrap>
                        <Tag color={post.gpa_matched ? 'success' : 'error'} icon={<TrophyOutlined />}>
                          GPA {post.gpa_matched ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </Tag>
                        <Tag color={post.interest_matched ? 'success' : 'default'} icon={<HeartOutlined />}>
                          ความสนใจ {post.interest_matched ? 'ตรง' : 'ไม่ตรง'}
                        </Tag>
                        <Tag color={post.location_matched ? 'success' : 'warning'} icon={<EnvironmentOutlined />}>
                          {post.location_matched ? 'จังหวัดเดียวกัน' : 'ต่างจังหวัด'}
                        </Tag>
                      </Space>
                    </div>

                    {post.recommend_reason.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
                          <StarOutlined /> จุดแข็ง:
                        </Text>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {post.recommend_reason.slice(0, 2).map((reason, idx) => (
                            <div key={idx}>• {reason}</div>
                          ))}
                          {post.recommend_reason.length > 2 && (
                            <Text type="secondary">และอีก {post.recommend_reason.length - 2} รายการ...</Text>
                          )}
                        </div>
                      </div>
                    )}

                    {Array.isArray(post.skill_gap) && post.skill_gap.length > 0 && (
                      <div>
                        <Text strong style={{ color: '#fa8c16', fontSize: 12 }}>
                          💡 ทักษะที่ควรพัฒนา:
                        </Text>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {post.skill_gap.slice(0, 2).join(', ')}
                          {post.skill_gap.length > 2 && '...'}
                        </div>
                      </div>
                    )}
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Settings Modal */}
      <Modal
        title="ปรับแต่งการแนะนำงาน"
        open={settingsVisible}
        onOk={applyCustomWeights}
        onCancel={() => setSettingsVisible(false)}
        width={600}
        footer={[
          <Button key="reset" onClick={resetWeights}>
            รีเซ็ต
          </Button>,
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>
            ยกเลิก
          </Button>,
          <Button key="apply" type="primary" onClick={applyCustomWeights}>
            นำไปใช้
          </Button>
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="ปรับน้ำหนักปัจจัยต่างๆ ในการแนะนำงาน"
            description="ยิ่งค่าสูง หมายถึงปัจจัยนั้นสำคัญมากขึ้น"
            type="info"
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginBottom: 24 }}>
            <Text strong>ทักษะ (Skills): {(weights.skills_weight * 100).toFixed(0)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={weights.skills_weight}
              onChange={(value) => handleWeightChange('skills_weight', value)}
              tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong>เกรดเฉลี่ย (GPA): {(weights.gpa_weight * 100).toFixed(0)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={weights.gpa_weight}
              onChange={(value) => handleWeightChange('gpa_weight', value)}
              tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong>ความสนใจ (Interest): {(weights.interest_weight * 100).toFixed(0)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={weights.interest_weight}
              onChange={(value) => handleWeightChange('interest_weight', value)}
              tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong>สถานที่ (Location): {(weights.location_weight * 100).toFixed(0)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={weights.location_weight}
              onChange={(value) => handleWeightChange('location_weight', value)}
              tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>การศึกษา (Education): {(weights.education_weight * 100).toFixed(0)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={weights.education_weight}
              onChange={(value) => handleWeightChange('education_weight', value)}
              tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
            />
          </div>

          <Divider />
          <Text type="secondary">
            รวมทั้งหมด: {((weights.gpa_weight + weights.skills_weight + weights.interest_weight + weights.location_weight + weights.education_weight) * 100).toFixed(0)}%
          </Text>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={selectedPost?.post_name}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            ปิด
          </Button>,
          <Button key="apply" type="primary">
            สมัครตำแหน่งนี้
          </Button>
        ]}
      >
        {selectedPost && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" title="ข้อมูลพื้นฐาน">
                  <p><strong>บริษัท:</strong> {selectedPost.company_name}</p>
                  <p><strong>คะแนนความเหมาะสม:</strong> 
                    <Tag color={getScoreColor(selectedPost.score)} style={{ marginLeft: 8 }}>
                      {(selectedPost.score * 100).toFixed(1)}%
                    </Tag>
                  </p>
                  <p><strong>ระดับความมั่นใจ:</strong> 
                    <Tag color={getConfidenceColor(selectedPost.confidence_level)} style={{ marginLeft: 8 }}>
                      {selectedPost.confidence_level}
                    </Tag>
                  </p>
                  <p><strong>อันดับ:</strong> #{selectedPost.ranking}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="เกณฑ์การรับ">
                  <p><strong>GPA ขั้นต่ำ:</strong> {selectedPost.min_gpa.toFixed(2)}</p>
                  <p><strong>GPA ของคุณ:</strong> 
                    <span style={{ color: selectedPost.gpa_matched ? '#52c41a' : '#f5222d' }}>
                      {selectedPost.gpa.toFixed(2)}
                    </span>
                  </p>
                  <p><strong>ทักษะที่ตรงกัน:</strong> {selectedPost.matched_skills}/{selectedPost.total_required}</p>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="จุดแข็งของคุณ" headStyle={{ backgroundColor: '#f6ffed' }}>
                  <List
                    size="small"
                    dataSource={selectedPost.recommend_reason}
                    renderItem={(item) => (
                      <List.Item>
                        <Text style={{ color: '#52c41a' }}>✓ {item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="จุดที่ควรพัฒนา" headStyle={{ backgroundColor: '#fff7e6' }}>
                  {selectedPost.weak_points.length > 0 && (
                    <List
                      size="small"
                      dataSource={selectedPost.weak_points}
                      renderItem={(item) => (
                        <List.Item>
                          <Text style={{ color: '#fa8c16' }}>⚠ {item}</Text>
                        </List.Item>
                      )}
                    />
                  )}
                  {Array.isArray(selectedPost?.skill_gap) && selectedPost.skill_gap.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>ทักษะที่ควรเรียนรู้:</Text>
                      <div style={{ marginTop: 8 }}>
                        {selectedPost.skill_gap.map((skill: string, idx: number) => (
                          <Tag key={idx} color="orange" style={{ margin: '2px' }}>
                            {skill}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Card 
              size="small" 
              title="การวิเคราะห์ความเหมาะสม" 
              style={{ marginTop: 16 }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="ทักษะ"
                    value={((selectedPost.matched_skills / selectedPost.total_required) * 100)}
                    precision={0}
                    suffix="%"
                    valueStyle={{ color: selectedPost.matched_skills > 0 ? '#52c41a' : '#f5222d' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="GPA"
                    value={selectedPost.gpa_matched ? '100' : '0'}
                    suffix="%"
                    valueStyle={{ color: selectedPost.gpa_matched ? '#52c41a' : '#f5222d' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="ความสนใจ"
                    value={selectedPost.interest_matched ? '100' : '0'}
                    suffix="%"
                    valueStyle={{ color: selectedPost.interest_matched ? '#52c41a' : '#f5222d' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="สถานที่"
                    value={selectedPost.location_matched ? '100' : '50'}
                    suffix="%"
                    valueStyle={{ color: selectedPost.location_matched ? '#52c41a' : '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
      </div>
    </Layout>
  );
}

export default StudentRecommendedPosts;