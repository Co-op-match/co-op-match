import React, { useContext } from 'react';
import {
  Layout,
  Typography,
  Button,
} from 'antd';
import { useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate
//import CoopMatchHeaderDefault from '../component/CoopMatchHeader';
import CoopMatchHeaderDefault from '../Component/CoopMatchHeader';
import { UserContext } from '../../components/UserContext';
const { Header, Content } = Layout;

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate(); // ใช้งาน hook
  const { logout } = useContext(UserContext);

  const handleLogout = () => {
    // เคลียร์ทุกอย่างที่เกี่ยวข้องกับ session
    logout();
    // redirect กลับไปหน้า login
    navigate("/sign-in");
  };
  
  
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <CoopMatchHeaderDefault />
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end', // ให้ปุ่ม logout ชิดขวา
            alignItems: 'center',
          }}
        >
          <Button type="primary" danger onClick={handleLogout}>
            ออกจากระบบ
          </Button>
         </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 8 }}>
          <Typography.Title level={3}>เกี่ยวกับเรา</Typography.Title>
          <Typography.Paragraph>
            COOP MATCH เป็นแพลตฟอร์มลงประกาศงานฟรี ที่เชื่อมต่อนักศึกษาฝึกงานกับโอกาสการฝึกงานที่เหมาะสม ด้วยเทคโนโลยี AI ที่ช่วยจับคู่ข้อมูลอย่างแม่นยำ เพื่อให้การค้นหางานและคนเป็นไปอย่างมีประสิทธิภาพสูงสุด
          </Typography.Paragraph>
          <Typography.Paragraph>
            นอกจากนี้เรายังมี งานสำหรับเด็กจบใหม่ และงานที่ยินดีรับนักศึกษาจบใหม่ งานประจำที่รับผู้มีประสบการณ์ หรืองานพาร์ทไทม์ จากบริษัทชั้นนำต่างๆ มากมาย ทั่วทุกจังหวัดในไทย
          </Typography.Paragraph>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;