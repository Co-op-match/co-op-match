import React from "react";
import { Card, Skeleton } from "antd";
import "./StudentProfile.css";

const ProfileSkeleton: React.FC = () => {
  return (
    <Card bordered className="student-profile-card">
      <div className="student-profile-container">
        {/* Left Side Skeleton */}
        <div className="student-profile-left">
          <div className="student-avatar-container">
            <Skeleton.Avatar 
              size={120} 
              shape="circle" 
              active 
              style={{ border: "2px solid #f0f0f0" }}
            />
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px', width: '100%' }}>
            <Skeleton.Input 
              style={{ width: '180px', height: '24px', marginBottom: '8px' }} 
              active 
              size="default"
            />
            <Skeleton.Input 
              style={{ width: '220px', height: '20px', marginBottom: '4px' }} 
              active 
              size="small"
            />
            <Skeleton.Input 
              style={{ width: '160px', height: '18px' }} 
              active 
              size="small"
            />
          </div>
        </div>

        {/* Right Side Skeleton */}
        <div className="student-profile-details">
          {/* Personal Section */}
          <div className="section-header">
            <Skeleton.Input 
              style={{ width: '140px', height: '24px' }} 
              active 
              size="default"
            />
            <Skeleton.Button 
              style={{ width: '80px', height: '32px' }} 
              active 
              size="default"
            />
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton.Input 
                    style={{ width: '60px', height: '14px', marginBottom: '4px' }} 
                    active 
                    size="small"
                  />
                  <Skeleton.Input 
                    style={{ width: '100px', height: '16px' }} 
                    active 
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Education Section */}
          <div className="section-header">
            <Skeleton.Input 
              style={{ width: '160px', height: '24px' }} 
              active 
              size="default"
            />
            <Skeleton.Button 
              style={{ width: '80px', height: '32px' }} 
              active 
              size="default"
            />
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton.Input 
                    style={{ width: '70px', height: '14px', marginBottom: '4px' }} 
                    active 
                    size="small"
                  />
                  <Skeleton.Input 
                    style={{ width: '120px', height: '16px' }} 
                    active 
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Address Section */}
          <div className="section-header">
            <Skeleton.Input 
              style={{ width: '120px', height: '24px' }} 
              active 
              size="default"
            />
            <Skeleton.Button 
              style={{ width: '80px', height: '32px' }} 
              active 
              size="default"
            />
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton.Input 
                    style={{ width: '80px', height: '14px', marginBottom: '4px' }} 
                    active 
                    size="small"
                  />
                  <Skeleton.Input 
                    style={{ width: '110px', height: '16px' }} 
                    active 
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSkeleton;