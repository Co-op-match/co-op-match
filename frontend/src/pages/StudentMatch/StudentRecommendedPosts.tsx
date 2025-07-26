import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Tag, Spin, Empty } from 'antd';
import { GetRecommendedPosts } from '../../services/https';

const { Title, Text } = Typography;

interface MatchResult {
  gpa: number;
  min_gpa: number;
  post_id: number;
  post_name: string;
  company_name: string;
  score: number;
  matched_skills: number;
  total_required: number;
  gpa_matched: boolean;
  interest_matched: boolean;
  location_matched: boolean;
}

function StudentRecommendedPosts() {
  const [recommendedPosts, setRecommendedPosts] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = localStorage.getItem('id'); // assume student login

  useEffect(() => {
    if (studentId) {
      GetRecommendedPosts(Number(studentId)).then((res) => {
        setRecommendedPosts(res.data || []);
        setLoading(false);
      });
    }
  }, [studentId]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>โพสต์ฝึกงานที่แนะนำสำหรับคุณ</Title>
      {loading ? (
        <Spin size="large" />
      ) : recommendedPosts.length === 0 ? (
        <Empty description="ไม่พบโพสต์ที่แนะนำ" />
      ) : (
        <Row gutter={[16, 16]}>
          {recommendedPosts.map((post) => (
            <Col key={post.post_id} xs={24} sm={12} md={8}>
              <Card title={post.post_name} bordered={true}>
                <Text strong>บริษัท:</Text> {post.company_name} <br />
                <Text strong>คะแนนความเหมาะสม:</Text> {post.score.toFixed(2)}<br />
                <Text>ตรงกับทักษะ: {post.matched_skills}/{post.total_required}</Text>
                <div style={{ marginTop: 8 }}>
                  $1
<Text type="secondary">GPA ของคุณ: {post.gpa.toFixed(2)} / ขั้นต่ำ: {post.min_gpa.toFixed(2)}</Text>
                  <Tag color={post.interest_matched ? 'green' : 'red'}>ความสนใจ {post.interest_matched ? 'ตรง' : 'ไม่ตรง'}</Tag>
                  <Tag color={post.location_matched ? 'green' : 'red'}>สถานที่ {post.location_matched ? 'ตรง' : 'ไม่ตรง'}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default StudentRecommendedPosts;
