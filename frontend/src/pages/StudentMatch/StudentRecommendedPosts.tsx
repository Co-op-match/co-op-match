import  { useEffect, useState } from 'react';
import { 
  Card, Col, Row, Typography, Tag, Empty, Progress, Button, Modal, List,
  Statistic, Badge, Tooltip, Slider, Space, Alert, Divider, Layout, message
} from 'antd';
import { CoopMatchLoader } from '../../components/loaders';
import { 
  TrophyOutlined, BulbOutlined, EnvironmentOutlined, BookOutlined, SettingOutlined,
  InfoCircleOutlined, HeartOutlined, StarOutlined,
  TrophyFilled
} from '@ant-design/icons';
import { GetLikedPostsByStudentID, GetRecommendedPosts, GetStudentByUserId, LikePost, DeleteLikedPost } from '../../services/https';
import CoopMatchHeaderDefault from '../Component/Coop_MatchHeader';
import type { MatchResult } from '../../interfaces/MatchResult';
import type { MatchingWeights } from '../../interfaces/MatchingWeights';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/* ----------------------- helpers ป้องกัน NaN/ค่าหลุด ----------------------- */
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const safeNumber = (v: any, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const safePercent = (num: any, den: any) => {
  const n = safeNumber(num);
  const d = safeNumber(den);
  if (d <= 0) return 0;
  return clamp(Math.round((n / d) * 100));
};
const safeToFixed = (v: any, digits = 2) => {
  const n = safeNumber(v, 0);
  return n.toFixed(digits);
};

function StudentRecommendedPosts() {
  const navigate = useNavigate();
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
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  /* ----------------------- โหลดข้อมูลแนะนำ + liked ----------------------- */
  const fetchRecommendations = async (customWeights?: MatchingWeights) => {
    setLoading(true);
    try {
      const userId = Number(localStorage.getItem('id'));
      if (!userId) {
        console.error('❌ ไม่พบ user ID');
        setRecommendedPosts([]);
        return;
      }

      const studentRes = await GetStudentByUserId(userId);
      const studentId = (studentRes as any)?.ID;
      if (!studentId) {
        console.error('❌ ไม่พบ student ID');
        setRecommendedPosts([]);
        return;
      }

      const q = customWeights
        ? `?gpa_weight=${customWeights.gpa_weight}&skills_weight=${customWeights.skills_weight}&interest_weight=${customWeights.interest_weight}&location_weight=${customWeights.location_weight}&education_weight=${customWeights.education_weight}`
        : '';

      const res = await GetRecommendedPosts(studentId, q);
      const matches = res?.data?.matches;
      if (res?.status === 200 && Array.isArray(matches)) {
        setRecommendedPosts(matches);
      } else {
        console.warn('⚠️ res.data.matches ไม่ถูกต้อง:', res);
        setRecommendedPosts([]);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setRecommendedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const userId = Number(localStorage.getItem('id'));
      if (!userId) { setLoading(false); return; }

      try {
        const student = await GetStudentByUserId(userId);
        const studentId = (student as any)?.ID;

        if (!studentId) throw new Error('no student ID');

        // Recommended
        const res = await GetRecommendedPosts(studentId);
        const matches = res?.data?.matches;
        setRecommendedPosts(Array.isArray(matches) ? matches : []);

        // Liked (รองรับทั้ง res.data และ res แบบ array)
        const likedRes = await GetLikedPostsByStudentID(studentId);
        const raw = Array.isArray(likedRes?.data) ? likedRes.data : (Array.isArray(likedRes) ? likedRes : []);
        // รองรับ key ต่างกัน: IntershipPostID | intership_post_id
        const likedIds = raw
          .map((it: any) => it?.IntershipPostID ?? it?.intership_post_id ?? it?.post_id)
          .filter((x: any) => Number.isFinite(Number(x)))
          .map((x: any) => Number(x));
        setLikedPosts(likedIds);
      } catch (e) {
        console.error('❌ Error fetching data', e);
        setRecommendedPosts([]);
        setLikedPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ----------------------- UI helpers ----------------------- */
  const getScoreColor = (scoreRaw: any) => {
    const score = safeNumber(scoreRaw, 0);
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    if (score >= 0.4) return '#fa8c16';
    return '#f5222d';
  };

  const getConfidenceColor = (level: any) => {
    switch (String(level || '').trim()) {
      case 'สูง': return 'green';
      case 'ปานกลาง': return 'orange';
      case 'ต่ำ': return 'red';
      default: return 'gray';
    }
  };

  /* ----------------------- Weights ----------------------- */
  const handleWeightChange = (key: keyof MatchingWeights, value: number) => {
    const v = clamp(value * 100, 0, 100) / 100; // กันค่าหลุด 0..1
    setWeights(prev => ({ ...prev, [key]: v }));
  };

  const applyCustomWeights = () => {
    fetchRecommendations(weights);
    setSettingsVisible(false);
  };

  const resetWeights = () => {
    setWeights({
      gpa_weight: 0.20,
      skills_weight: 0.40,
      interest_weight: 0.20,
      location_weight: 0.15,
      education_weight: 0.05
    });
  };

  /* ----------------------- Like/Unlike ----------------------- */
  const handleToggleLike = async (postId: number) => {
    try {
      const userId = Number(localStorage.getItem('id'));
      if (!userId) return message.error('ไม่พบข้อมูลผู้ใช้');

      const studentRes = await GetStudentByUserId(userId);
      const studentId = (studentRes as any)?.ID;
      if (!studentId) return message.error('ไม่พบข้อมูลนักศึกษา');

      if (likedPosts.includes(postId)) {
        await DeleteLikedPost(studentId, postId);
        setLikedPosts(prev => prev.filter(id => id !== postId));
        message.info('ลบโพสต์ออกจากรายการสนใจแล้ว');
      } else {
        await LikePost({ StudentID: studentId, IntershipPostID: postId });
        setLikedPosts(prev => [...prev, postId]);
        message.success('เพิ่มโพสต์ในรายการสนใจแล้ว');
      }
    } catch (err) {
      console.error('❌ Error toggling like:', err);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getCardActions = (post: MatchResult) => [
    <Button 
      key="detail"
      type="link" 
      onClick={(e) => {
        e.stopPropagation();
        setSelectedPost(post);
        setDetailVisible(true);
      }}
    >
      ดูรายละเอียด
    </Button>,
    <Button
      key="like"
      type="link"
      icon={<HeartOutlined />}
      style={{
        color: likedPosts.includes((post as any)?.post_id) ? '#eb2f96' : '#aaa',
        fontWeight: 500,
        transition: 'color 0.3s'
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const pid = Number((post as any)?.post_id);
        if (Number.isFinite(pid)) handleToggleLike(pid);
      }}
    >
      {likedPosts.includes((post as any)?.post_id) ? 'ลบออก' : 'สนใจ'}
    </Button>
  ];

  /* ----------------------- render ----------------------- */
  const avgScore = recommendedPosts.length
    ? safeNumber(
        recommendedPosts.reduce((sum, p) => sum + safeNumber((p as any)?.score, 0), 0) / recommendedPosts.length,
        0
      )
    : 0;

  return (
    <Layout style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <CoopMatchHeaderDefault />

      <div style={{ marginBottom: 24, padding: '24px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TrophyFilled  style={{ color: '#faad14', marginRight: 8 }} />
            งานที่แนะนำสำหรับคุณ
          </Title>
          <Space>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsVisible(true)}>
              ปรับแต่งการแนะนำ
            </Button>
            <Button type="primary" onClick={() => fetchRecommendations()}>
              รีเฟรช
            </Button>
          </Space>
        </Space>

        {!loading && recommendedPosts.length > 0 && (
          <Alert
            message="เคล็ดลับ"
            description="คะแนนนี้ดูจากสกิล เกรด ความชอบ แล้วก็โลเคชัน! อยากให้เรื่องไหนเด่น ปรับน้ำหนักได้ตามใจเลยจ้า 🎯"
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16, marginTop: 16 }}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <CoopMatchLoader size="lg" />
            <div style={{ marginTop: 16 }}>กำลังวิเคราะห์งานที่เหมาะสมกับคุณ...</div>
          </div>
        ) : Array.isArray(recommendedPosts) && recommendedPosts.length === 0 ? (
          <Empty description="“อยากได้งานแนะนำ? ต้องใส่ข้อมูลโปรไฟล์ก่อนน้า ✨”" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic title="งานทั้งหมด" value={recommendedPosts.length} prefix={<BookOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="งานที่เหมาะสมมาก"
                  value={recommendedPosts.filter(p => safeNumber((p as any)?.score, 0) >= 0.8).length}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="คะแนนเฉลี่ย"
                  value={avgScore}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title="อัปเดตล่าสุด" value="เมื่อสักครู่" prefix={<InfoCircleOutlined />} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {recommendedPosts.map((post, index) => {
                const score = safeNumber((post as any)?.score, 0);
                const scorePct = clamp(Math.round(score * 100));
                const confidence = (post as any)?.confidence_level || '-';
                const matched = safeNumber((post as any)?.matched_skills, 0);
                const totalReq = safeNumber((post as any)?.total_required, 0);
                const gpa = safeNumber((post as any)?.gpa, 0);
                const minGpa = safeNumber((post as any)?.min_gpa, 0);
                const gpaMatched = Boolean((post as any)?.gpa_matched);
                const interestMatched = Boolean((post as any)?.interest_matched);
                const locationMatched = Boolean((post as any)?.location_matched);

                return (
                  <Col key={(post as any)?.post_id ?? index} xs={24} sm={12} lg={8}>
                    <Badge.Ribbon text={`อันดับ ${(post as any)?.ranking ?? '-'}`} color={index < 3 ? 'gold' : 'blue'}>
                      <Card
                        hoverable
                        style={{ height: '100%' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(24, 144, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.2)';
                        }}
                        actions={getCardActions(post)}
                      >
                        <div style={{ marginBottom: 12 }}>
                          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                            {(post as any)?.post_name ?? '-'}
                          </Title>
                          <Text type="secondary">{(post as any)?.company_name ?? '-'}</Text>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <Progress
                            percent={scorePct}
                            strokeColor={getScoreColor(score)}
                            format={(percent) => `${safeNumber(percent, 0)}% เหมาะสม`}
                          />
                          <div style={{ marginTop: 8, textAlign: 'center' }}>
                            <Tag color={getConfidenceColor(confidence)}>ความมั่นใจ: {String(confidence)}</Tag>
                          </div>
                        </div>

                        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                          <Col span={12}>
                            <Tooltip title="ทักษะที่ตรงกัน">
                              <div style={{ textAlign: 'center' }}>
                                <BulbOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                                <div>{matched}/{totalReq}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>ทักษะ</Text>
                              </div>
                            </Tooltip>
                          </Col>
                          <Col span={12}>
                            <Tooltip title="เกรดเฉลี่ย">
                              <div style={{ textAlign: 'center' }}>
                                <TrophyOutlined style={{ color: gpaMatched ? '#52c41a' : '#f5222d', fontSize: 16 }} />
                                <div>{safeToFixed(gpa, 2)}/{safeToFixed(minGpa, 2)}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>GPA</Text>
                              </div>
                            </Tooltip>
                          </Col>
                        </Row>

                        <div style={{ marginBottom: 12 }}>
                          <Space wrap>
                            <Tag color={gpaMatched ? 'success' : 'error'} icon={<TrophyOutlined />}>
                              GPA {gpaMatched ? 'ผ่าน' : 'ไม่ผ่าน'}
                            </Tag>
                            <Tag color={interestMatched ? 'success' : 'default'} icon={<HeartOutlined />}>
                              ความสนใจ {interestMatched ? 'ตรง' : 'ไม่ตรง'}
                            </Tag>
                            <Tag color={locationMatched ? 'success' : 'warning'} icon={<EnvironmentOutlined />}>
                              {locationMatched ? 'จังหวัดเดียวกัน' : 'ต่างจังหวัด'}
                            </Tag>
                          </Space>
                        </div>

                        {Array.isArray((post as any)?.recommend_reason) && (post as any).recommend_reason.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
                              <StarOutlined /> จุดแข็ง:
                            </Text>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              {(post as any).recommend_reason.slice(0, 2).map((reason: string, idx: number) => (
                                <div key={idx}>• {reason}</div>
                              ))}
                              {(post as any).recommend_reason.length > 2 && (
                                <Text type="secondary">และอีก {(post as any).recommend_reason.length - 2} รายการ...</Text>
                              )}
                            </div>
                          </div>
                        )}

                        {Array.isArray((post as any)?.skill_gap) && (post as any).skill_gap.length > 0 && (
                          <div>
                            <Text strong style={{ color: '#fa8c16', fontSize: 12 }}>
                              💡 ทักษะที่ควรพัฒนา:
                            </Text>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              {(post as any).skill_gap.slice(0, 2).join(', ')}
                              {(post as any).skill_gap.length > 2 && '...'}
                            </div>
                          </div>
                        )}
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                );
              })}
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
            <Button key="reset" onClick={resetWeights}>รีเซ็ต</Button>,
            <Button key="cancel" onClick={() => setSettingsVisible(false)}>ยกเลิก</Button>,
            <Button key="apply" type="primary" onClick={applyCustomWeights}>นำไปใช้</Button>
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
                min={0} max={1} step={0.05}
                value={weights.skills_weight}
                onChange={(v) => handleWeightChange('skills_weight', v as number)}
                tooltip={{ formatter: (v) => `${safeNumber(v, 0) * 100}%` }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>เกรดเฉลี่ย (GPA): {(weights.gpa_weight * 100).toFixed(0)}%</Text>
              <Slider
                min={0} max={1} step={0.05}
                value={weights.gpa_weight}
                onChange={(v) => handleWeightChange('gpa_weight', v as number)}
                tooltip={{ formatter: (v) => `${safeNumber(v, 0) * 100}%` }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>ความสนใจ (Interest): {(weights.interest_weight * 100).toFixed(0)}%</Text>
              <Slider
                min={0} max={1} step={0.05}
                value={weights.interest_weight}
                onChange={(v) => handleWeightChange('interest_weight', v as number)}
                tooltip={{ formatter: (v) => `${safeNumber(v, 0) * 100}%` }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>สถานที่ (Location): {(weights.location_weight * 100).toFixed(0)}%</Text>
              <Slider
                min={0} max={1} step={0.05}
                value={weights.location_weight}
                onChange={(v) => handleWeightChange('location_weight', v as number)}
                tooltip={{ formatter: (v) => `${safeNumber(v, 0) * 100}%` }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>การศึกษา (Education): {(weights.education_weight * 100).toFixed(0)}%</Text>
              <Slider
                min={0} max={1} step={0.05}
                value={weights.education_weight}
                onChange={(v) => handleWeightChange('education_weight', v as number)}
                tooltip={{ formatter: (v) => `${safeNumber(v, 0) * 100}%` }}
              />
            </div>

            <Divider />
            <Text type="secondary">
              รวมทั้งหมด: {clamp(((weights.gpa_weight + weights.skills_weight + weights.interest_weight + weights.location_weight + weights.education_weight) * 100), 0, 100).toFixed(0)}%
            </Text>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={selectedPost?.post_name ?? '-'}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>ปิด</Button>,
            <Button
              key="apply"
              type="primary"
              onClick={() => selectedPost && navigate(`/student/post-student/${(selectedPost as any)?.post_id}`)}
            >
              สมัครตำแหน่งนี้
            </Button>
          ]}
        >
          {selectedPost && (() => {
            const matched = safeNumber((selectedPost as any)?.matched_skills, 0);
            const totalReq = safeNumber((selectedPost as any)?.total_required, 0);
            const gpa = safeNumber((selectedPost as any)?.gpa, 0);
            const minGpa = safeNumber((selectedPost as any)?.min_gpa, 0);
            const gpaMatched = Boolean((selectedPost as any)?.gpa_matched);
            const interestMatched = Boolean((selectedPost as any)?.interest_matched);
            const locationMatched = Boolean((selectedPost as any)?.location_matched);
            const score = safeNumber((selectedPost as any)?.score, 0);
            const conf = (selectedPost as any)?.confidence_level || '-';
            const ranking = (selectedPost as any)?.ranking ?? '-';

            return (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={12}>
                    <Card size="small" title="ข้อมูลพื้นฐาน">
                      <p><strong>บริษัท:</strong> {(selectedPost as any)?.company_name ?? '-'}</p>
                      <p><strong>คะแนนความเหมาะสม:</strong>
                        <Tag color={getScoreColor(score)} style={{ marginLeft: 8 }}>
                          {clamp(Math.round(score * 100))}%
                        </Tag>
                      </p>
                      <p><strong>ระดับความมั่นใจ:</strong>
                        <Tag color={getConfidenceColor(conf)} style={{ marginLeft: 8 }}>
                          {String(conf)}
                        </Tag>
                      </p>
                      <p><strong>อันดับ:</strong> #{String(ranking)}</p>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="เกณฑ์การรับ">
                      <p><strong>GPA ขั้นต่ำ:</strong> {safeToFixed(minGpa, 2)}</p>
                      <p><strong>GPA ของคุณ: </strong>
                        <span style={{ color: gpaMatched ? '#52c41a' : '#f5222d' }}>
                          {safeToFixed(gpa, 2)}
                        </span>
                      </p>
                      <p><strong>ทักษะที่ตรงกัน:</strong> {matched}/{totalReq}</p>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="จุดแข็งของคุณ" headStyle={{ backgroundColor: '#f6ffed' }}>
                      <List
                        size="small"
                        dataSource={Array.isArray((selectedPost as any)?.recommend_reason) ? (selectedPost as any).recommend_reason : []}
                        renderItem={(item: string) => (
                          <List.Item><Text style={{ color: '#52c41a' }}>✓ {item}</Text></List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="จุดที่ควรพัฒนา" headStyle={{ backgroundColor: '#fff7e6' }}>
                      {Array.isArray((selectedPost as any)?.weak_points) && (selectedPost as any).weak_points.length > 0 && (
                        <List
                          size="small"
                          dataSource={(selectedPost as any).weak_points}
                          renderItem={(item: string) => (
                            <List.Item><Text style={{ color: '#fa8c16' }}>⚠ {item}</Text></List.Item>
                          )}
                        />
                      )}
                      {Array.isArray((selectedPost as any)?.skill_gap) && (selectedPost as any).skill_gap.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Text strong>ทักษะที่ควรเรียนรู้:</Text>
                          <div style={{ marginTop: 8 }}>
                            {(selectedPost as any).skill_gap.map((skill: string, idx: number) => (
                              <Tag key={idx} color="orange" style={{ margin: '2px' }}>{skill}</Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                <Card size="small" title="การวิเคราะห์ความเหมาะสม" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="ทักษะ"
                        value={safePercent(matched, totalReq)}
                        precision={0}
                        suffix="%"
                        valueStyle={{ color: matched > 0 ? '#52c41a' : '#f5222d' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="GPA"
                        value={gpaMatched ? 100 : 0}
                        suffix="%"
                        valueStyle={{ color: gpaMatched ? '#52c41a' : '#f5222d' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="ความสนใจ"
                        value={interestMatched ? 100 : 0}
                        suffix="%"
                        valueStyle={{ color: interestMatched ? '#52c41a' : '#f5222d' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="สถานที่"
                        value={locationMatched ? 100 : 50}
                        suffix="%"
                        valueStyle={{ color: locationMatched ? '#52c41a' : '#fa8c16' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
            );
          })()}
        </Modal>
      </div>
    </Layout>
  );
}

export default StudentRecommendedPosts;
