import React from 'react';

interface HamburgerIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const HamburgerIcon: React.FC<HamburgerIconProps> = ({
  size = 20,
  color = '#333',
  className = ''
}) => {
  const lineStyle: React.CSSProperties = {
    display: 'block',
    width: `${size}px`,
    height: '2px',
    backgroundColor: color,
    margin: '3px 0',
    borderRadius: '1px',
    transition: 'all 0.3s ease'
  };

  return (
    <div 
      className={`hamburger-icon ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: `${size}px`,
        height: `${size}px`,
        cursor: 'pointer'
      }}
    >
      <span style={lineStyle}></span>
      <span style={lineStyle}></span>
      <span style={lineStyle}></span>
    </div>
  );
};

export default HamburgerIcon;