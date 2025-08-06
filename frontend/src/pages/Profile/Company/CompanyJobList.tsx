// ✅ CompanyJobList.tsx
import React, { useEffect, useState } from 'react';
import { GetPostByCompanyId } from '../../../services/https/post';
import type { IntershipPostInterface } from '../../../interfaces/IntershipPost';
import { Row, Col, Empty, Spin } from 'antd';
import JobCard from './jobview';
import "./StudentReviews.css";
import { Briefcase } from 'lucide-react';


interface Props {
  companyId: number;
}

const CompanyJobList: React.FC<Props> = ({ companyId }) => {
  const [posts, setPosts] = useState<IntershipPostInterface[]>([]);
  const [loading, setLoading] = useState(true);
  

useEffect(() => {
  const fetch = async () => {
    try {
      const response = await GetPostByCompanyId(companyId);
      const posts: IntershipPostInterface[] = Array.isArray(response.data) ? response.data : [];

      const openPosts = posts.filter(
        (post) => post.StatusPost?.status_post === "Open"
      );

      setPosts(openPosts);
    } catch (err) {
      console.error("โหลดโพสต์ล้มเหลว:", err);
    } finally {
      setLoading(false);
    }
  };

  fetch();
}, [companyId]);


  if (loading) return <Spin size="large" style={{ display: "block", margin: "auto" }} />;
  if (posts.length === 0) return <Empty description="ยังไม่มีโพสต์ฝึกงาน" />;

  return (
    <div className="post-section">
<h2 className="section-post-title">
  <Briefcase color="#000000ff" size={25} />
  ตำแหน่งฝึกงานที่เปิดรับ
</h2>

    <Row gutter={[16, 16]}>
      {posts.map(post => (
        <Col key={post.ID} xs={24} sm={12} md={8}>
          <JobCard job={post} />
        </Col>
      ))}
    </Row>
    </div>
  );
};

export default CompanyJobList;
