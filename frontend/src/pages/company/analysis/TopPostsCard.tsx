import React from "react";
import { Card, List, Tag, Button, Typography, Skeleton, Empty, Space, Tooltip, Progress } from "antd";
import { FireFilled, EyeOutlined, TrophyOutlined, RiseOutlined, TeamOutlined } from "@ant-design/icons";
import type { TopPostItem } from "../../../interfaces/Analysis";

const { Text, Title } = Typography;

type Props = {
  loading?: boolean;
  topPosts?: TopPostItem[] | null;
  title?: string;
  onViewApplicants?: (postId: number) => void;
  maxItems?: number;
  bordered?: boolean;
};

const TopPostsCard: React.FC<Props> = ({
  loading = false,
  topPosts = [],
  onViewApplicants,
  maxItems = 5,
  bordered = true,
}) => {
  const data = Array.isArray(topPosts) ? topPosts.slice(0, maxItems) : [];
  const maxApplications = Math.max(...data.map(x => x?.applications ?? 0), 1);

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "#FFD700"; // Gold
      case 1: return "#C0C0C0"; // Silver  
      case 2: return "#CD7F32"; // Bronze
      default: return "#1677ff";
    }
  };

  const getRankIcon = (index: number) => {
    if (index < 3) return <TrophyOutlined style={{ color: getRankColor(index) }} />;
    return <RiseOutlined style={{ color: "#52c41a" }} />;
  };

  return (
    <Card
      className="chart-card"
      bordered={bordered}
      styles={{
        header: { 
          background: 'linear-gradient(135deg, rgba(255, 77, 79, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
          borderBottom: '1px solid rgba(255, 77, 79, 0.15)',
          borderRadius: '12px 12px 0 0'
        },
        body: { padding: '20px' }
      }}
    >
      {/* Enhanced Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Space align="center">
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
            }}>
              <FireFilled style={{ color: 'white', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#262626' }}>โพสต์งานยอดนิยม</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                อันดับโพสต์ที่ได้รับความสนใจมากที่สุด
              </Text>
            </div>
          </Space>
         
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '8px 0' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Skeleton.Input active size="small" style={{ width: 60, marginBottom: 8 }} />
              <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 1, width: ['40%'] }} />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={
              <div>
                <Text type="secondary">ยังไม่มีข้อมูลโพสต์ยอดนิยม</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>เริ่มโพสต์งานเพื่อดูสстатистики</Text>
              </div>
            }
          />
        </div>
      ) : (
        <List
          dataSource={data}
          split={false}
          renderItem={(item, index) => (
            <List.Item
              style={{ 
                padding: '16px 0',
                borderBottom: index === data.length - 1 ? 'none' : '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                borderRadius: 8,
                marginBottom: 8
              }}
              className="hover-item"
            >
              <div style={{ width: '100%' }}>
                {/* Rank & Title Row */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getRankColor(index)}22 0%, ${getRankColor(index)}11 100%)`,
                    border: `2px solid ${getRankColor(index)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: getRankColor(index)
                  }}>
                    {getRankIcon(index)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15, color: '#262626' }}>
                        {item.postName}
                      </Text>
                      <Tag 
                        color={index < 3 ? 'gold' : 'blue'} 
                        style={{ 
                          marginLeft: 8, 
                          fontSize: 11, 
                          fontWeight: 600,
                          padding: '2px 8px'
                        }}
                      >
                        อันดับ {index + 1}
                      </Tag>
                    </div>
                    
                    {/* Progress Bar */}
                    <Progress
                      percent={(item.applications / maxApplications) * 100}
                      size="small"
                      strokeColor={{
                        '0%': getRankColor(index),
                        '100%': index < 3 ? '#faad14' : '#52c41a'
                      }}
                      showInfo={false}
                      style={{ marginBottom: 8 }}
                    />
                    
                    {/* Stats Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Space size={4}>
                        <TeamOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                        <Text style={{ fontSize: 13, fontWeight: 600, color: '#52c41a' }}>
                          {item.applications} ผู้สมัคร
                        </Text>
                      </Space>
                      
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ID: {item.postId}
                      </Text>
                      
                      <div style={{ flex: 1 }} />
                      
                      <Tooltip title="ดูรายละเอียดผู้สมัคร">
                        <Button
                          type="primary"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => onViewApplicants?.(item.postId)}
                          style={{
                            borderRadius: 6,
                            height: 28,
                            fontSize: 12,
                            background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.3)'
                          }}
                        >
                          ดูผู้สมัคร
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
      
      <style>
        {`
          .hover-item:hover {
            background: rgba(24, 144, 255, 0.02) !important;
            transform: translateX(4px);
          }
          
          .ant-progress-bg {
            border-radius: 4px !important;
          }
          
          .chart-card .ant-card-body {
            position: relative;
          }
        `}
      </style>
    </Card>
  );
};

export default TopPostsCard;