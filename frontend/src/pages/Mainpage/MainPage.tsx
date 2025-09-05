import { useEffect } from 'react';
import { Button, Typography, Row, Col, Card, Space } from 'antd';
import { useNavigate } from 'react-router-dom';   
import './MainPage.css';
import f from "../../assets/f.png";
import m from "../../assets/m.png";
import fm from "../../assets/fm.png";
import Logo from "../../assets/Co-op match-Photoroom.png";
import { Building2, GraduationCap, Presentation } from "lucide-react";

const { Title, Paragraph } = Typography;

function CoopMatchLanding() {
  const navigate = useNavigate(); 

  useEffect(() => {
    document.body.classList.add('is-loaded');
    return () => document.body.classList.remove('is-loaded');
  }, []);
  
  return (
    <div className="coopmatch-container">
      <div className="main-wrapper">
        <Card className="main-card" bordered={false}>
          {/* Header */}
          <div className="header">
            <div className="logo">
              <img src={Logo} alt="CoopMatch Logo" className="logo-img" />
            </div>
            <Space size="large" className="nav">
              {/* ปุ่ม log in */}
              <Button 
                className="signin-btn" 
                shape="round" 
                onClick={() => navigate('/sign-in')}
              >
                Log in
              </Button>

              {/* ปุ่ม register */}
              <Button 
                className="register-btn" 
                shape="round" 
                onClick={() => navigate('/role-select')}
              >
                Register
              </Button>
            </Space>
          </div>

          {/* Hero Content */}
          <Row gutter={[0, 40]} align="middle" className="hero-content" style={{ height: 'calc(100% - 80px)' }}>
            {/* Left Side - Text Content */}
            <Col xs={24} lg={12}>
              <div className="hero-text">
                <Title level={1} className="hero-title" >
                  Find your perfect<br />internship match
                </Title>
                <Paragraph className="hero-description">
                  CoopMatch connects students with top companies<br />
                  for meaningful co-op and internship opportunities
                </Paragraph>

                <Space size="middle" className="action-buttons">
                  <Button 
                    type="primary" 
                    size="large" 
                    className="primary-btn" 
                    shape="round"
                    onClick={() => navigate('/sign-in')}
                  >
                    Find Internships
                  </Button>
                  <Button 
                    size="large" 
                    className="secondary-btn" 
                    shape="round"
                    onClick={() => navigate('/sign-in')}
                  >
                    Post a Position
                  </Button>
                </Space>

                <Row gutter={[40, 16]} className="stats-section">
                  <Col>
                    <div className="stat-item" style={{ textAlign: "center", color: "#fff" }}>
                      <Building2 size={32} color="#fff" style={{ marginBottom: "5px" }} />
                      <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>Company</p>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item" style={{ textAlign: "center", color: "#fff" }}>
                      <GraduationCap size={32} color="#fff" style={{ marginBottom: "5px" }} />
                      <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>Student</p>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item" style={{ textAlign: "center", color: "#fff" }}>
                      <Presentation size={32} color="#fff" style={{ marginBottom: "5px" }} />
                      <p style={{ color: "#fff", fontSize: "14px", margin: 0 }}>Academic Staff</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right Side - Visual Elements */}
            <Col xs={24} lg={12}>
              <div className="hero-images">
                {/* Card 1 */}
                <div className="image-card card-1">
                  <img
                    src={f}
                    alt="Student working on laptop"
                    className="hero-img"
                  />
                </div>

                {/* Card 2 */}
                <div className="image-card card-2">
                  <img
                    src={fm}
                    alt="Team meeting"
                    className="hero-img"
                  />
                </div>

                {/* Card 3 */}
                <div className="image-card card-3">
                  <img
                    src={m}
                    alt="Student networking"
                    className="hero-img"
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default CoopMatchLanding;
