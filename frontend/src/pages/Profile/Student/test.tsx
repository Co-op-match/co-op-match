import React, { useState } from "react";
import { Card, Badge } from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const events = [
  { date: "2025-01-02", type: "warning", content: "ส่งเอกสารสหกิจ" },
  { date: "2025-01-03", type: "success", content: "นัดสัมภาษณ์กับบริษัท A" },
  { date: "2025-01-15", type: "error", content: "วันสุดท้ายอัปโหลดใบสมัคร" },
];

const StudentCalendarCard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs("2025-01-01"));
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: dayjs.Dayjs) => {
    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');
    
    const days = [];
    let current = startDate;
    
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const hasEvent = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return events.some(event => event.date === dateStr);
  };

  const getEventType = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    const event = events.find(event => event.date === dateStr);
    return event?.type || null;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => prev.add(direction, 'month'));
  };

  const getEventDotColor = (type: string) => {
    switch (type) {
      case 'warning': return '#faad14';
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = dayjs();

  return (
    <Card 
      title="ปฏิทินแจ้งเตือน" 
      bordered
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      headStyle={{
        background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(230, 245, 255, 0.9) 100%)',
        borderBottom: '2px solid rgba(13, 71, 161, 0.1)',
        fontSize: '16px',
        fontWeight: '600',
        color: '#0d47a1'
      }}
    >
      <div style={{ 
        display: 'flex', 
        height: '420px',
        gap: '24px'
      }}>
        {/* Calendar Section */}
        <div style={{ 
          flex: 1, 
          padding: '16px 20px 16px 16px',
          borderRight: '2px solid rgba(13, 71, 161, 0.08)',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.95) 100%)',
          borderRadius: '8px'
        }}>
          {/* Calendar Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '20px',
            padding: '8px 12px',
            background: 'rgba(240, 248, 255, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(13, 71, 161, 0.1)'
          }}>
            <button 
              onClick={() => navigateMonth(-1)}
              style={{
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f4ff 100%)',
                border: '1px solid rgba(13, 71, 161, 0.2)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f8ff 0%, #e6f4ff 100%)';
              }}
            >
              <LeftOutlined style={{ color: '#0d47a1', fontSize: '14px' }} />
            </button>
            
            <h3 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '700',
              color: '#0d47a1',
              textShadow: '1px 1px 3px rgba(13, 71, 161, 0.1)',
              letterSpacing: '-0.5px'
            }}>
              {months[currentDate.month()]}
            </h3>
            
            <button 
              onClick={() => navigateMonth(1)}
              style={{
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f4ff 100%)',
                border: '1px solid rgba(13, 71, 161, 0.2)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f8ff 0%, #e6f4ff 100%)';
              }}
            >
              <RightOutlined style={{ color: '#0d47a1', fontSize: '14px' }} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '4px',
            marginBottom: '12px'
          }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#0d47a1',
                padding: '10px 0',
                background: 'rgba(240, 248, 255, 0.6)',
                borderRadius: '6px',
                border: '1px solid rgba(13, 71, 161, 0.1)'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '4px'
          }}>
            {days.map((day, index) => {
              const isCurrentMonth = day.month() === currentDate.month();
              const isToday = day.isSame(today, 'day');
              const isSelected = day.date() === 2 && isCurrentMonth;
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isSelected 
                      ? '#1890ff' 
                      : isCurrentMonth 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'transparent',
                    color: isSelected 
                      ? '#fff' 
                      : isCurrentMonth 
                        ? '#333' 
                        : '#ccc',
                    fontWeight: isSelected || isToday ? '700' : '500',
                    border: isCurrentMonth ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                    boxShadow: isSelected 
                      ? '0 2px 8px rgba(24, 144, 255, 0.3)' 
                      : isCurrentMonth 
                        ? '0 1px 3px rgba(0, 0, 0, 0.1)' 
                        : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(240, 248, 255, 0.8)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCurrentMonth && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <span>{day.date()}</span>
                  {hasEvent(day) && isCurrentMonth && (
                    <div style={{
                      position: 'absolute',
                      bottom: '3px',
                      right: '3px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getEventDotColor(getEventType(day) || 'default'),
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div style={{ 
          width: '240px', 
          padding: '16px',
          background: 'linear-gradient(145deg, rgba(248, 252, 255, 0.9) 0%, rgba(240, 248, 255, 0.95) 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(13, 71, 161, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '18px',
            padding: '8px 12px',
            background: 'rgba(240, 248, 255, 0.7)',
            borderRadius: '6px',
            border: '1px solid rgba(13, 71, 161, 0.15)'
          }}>
            <CalendarOutlined style={{ 
              color: '#0d47a1', 
              fontSize: '16px',
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '4px'
            }} />
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#0d47a1',
              letterSpacing: '-0.2px'
            }}>
              Upcoming events
            </h4>
          </div>
          
          <div style={{ 
            height: '300px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {events.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {events.map((event, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px',
                    padding: '12px',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.8) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(13, 71, 161, 0.15)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                  }}
                  >
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getEventDotColor(event.type),
                      marginTop: '5px',
                      flexShrink: 0,
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: '#333',
                        lineHeight: '1.4',
                        marginBottom: '4px'
                      }}>
                        {event.content}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '11px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        {dayjs(event.date).format('DD/MM/YYYY')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                paddingTop: '80px',
                color: '#999'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: '2px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <CalendarOutlined style={{ color: '#ccc', fontSize: '20px' }} />
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px',
                  color: '#999',
                  fontWeight: '500'
                }}>
                  No upcoming events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Footer */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '2px solid rgba(13, 71, 161, 0.08)',
        textAlign: 'center',
        background: 'linear-gradient(90deg, rgba(240, 248, 255, 0.4) 0%, rgba(230, 245, 255, 0.6) 100%)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <Badge 
          status="success" 
          text="ไม่มีรายการแจ้งเตือนใหม่" 
          style={{ 
            fontSize: '13px',
            fontWeight: '500',
            color: '#52c41a'
          }}
        />
      </div>
    </Card>
  );
};

export default StudentCalendarCard;