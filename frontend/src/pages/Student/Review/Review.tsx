import React, { useState, useEffect } from "react";
import { Modal, Rate, Input, Button, message } from "antd";
import { StarFilled, HeartFilled, MessageOutlined } from "@ant-design/icons";
import { CreateReview } from "../../../services/https";
import type { ReviewPayload } from "../../../interface/IReview";

const ReviewModalContainer: React.FC<{
  open: boolean;
  onClose: () => void;
  studentId: number;
  companyId: number;
  onSuccess?: () => void;
}> = ({ open, onClose, studentId, companyId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning("กรุณาให้คะแนนก่อนส่งรีวิว");
      return;
    }

    setLoading(true);
    try {
      const payload: ReviewPayload = {
        rating,
        comment,
        StudentID: studentId,
        CompanyID: companyId,
      };
      await CreateReview(payload);
      message.success("รีวิวสำเร็จแล้ว ขอบคุณสำหรับการแบ่งปัน!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Error posting review:", error);
      message.error("เกิดข้อผิดพลาดในการรีวิว");
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "ไม่พอใจ";
      case 2: return "พอใช้";
      case 3: return "ปกติ";
      case 4: return "พอใจ";
      case 5: return "พอใจมาก";
      default: return "กรุณาให้คะแนน";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return "#ff4d4f";
    if (rating === 3) return "#faad14";
    return "#52c41a";
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={650}
      title={null}
      style={{ padding: 0 }}
      bodyStyle={{ padding: 0 }}
      destroyOnClose={true}
    >
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Decorative Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(24, 144, 255, 0.1) 100%)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)'
        }} />

        {/* Header */}
        <div style={{
          backgroundColor: 'rgb(175, 213, 244)',
          background: 'linear-gradient(135deg, rgb(175, 213, 244) 0%, rgb(135, 193, 244) 100%)',
          padding: '25px 35px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '8px'
          }}>
            <StarFilled style={{ fontSize: '24px', color: '#faad14' }} />
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#1f1f1f',
              margin: 0
            }}>
              แบ่งปันประสบการณ์ของคุณ
            </h2>
            <HeartFilled style={{ fontSize: '20px', color: '#ff4d4f' }} />
          </div>
          <p style={{
            fontSize: '14px',
            color: '#4a4a4a',
            margin: 0,
            fontWeight: '500'
          }}>
            ความคิดเห็นของคุณมีค่าสำหรับนักศึกษาคนอื่น
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '35px 40px' }}>
          {/* Rating Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '35px',
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '15px'
            }}>
              ความพึงพอใจโดยรวม
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <Rate
                value={rating}
                onChange={setRating}
                style={{
                  fontSize: '32px',
                  color: '#faad14'
                }}
                character={<StarFilled />}
              />
            </div>

            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: getRatingColor(rating),
              minHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {rating > 0 && (
                <>
                  <span>{getRatingText(rating)}</span>
                  {rating >= 4 && <HeartFilled style={{ color: '#ff4d4f' }} />}
                </>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div style={{
            marginBottom: '25px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '12px'
            }}>
              <MessageOutlined style={{ color: '#1890ff' }} />
              <span>เล่าประสบการณ์ของคุณ</span>
            </div>
            
            <Input.TextArea
              rows={5}
              placeholder="• เล่าเกี่ยวกับสภาพแวดล้อมการทำงาน&#10;• ความเป็นมิตรของเพื่อนร่วมงาน&#10;• ความรู้ที่ได้รับ&#10;• คำแนะนำสำหรับนักศึกษาคนต่อไป"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                fontSize: '14px',
                borderRadius: '12px',
                border: '2px solid #f0f0f0',
                padding: '15px',
                resize: 'none',
                fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1890ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#f0f0f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            
            <div style={{
              fontSize: '12px',
              color: '#8c8c8c',
              marginTop: '8px',
              textAlign: 'right'
            }}>
              {comment.length}/500 ตัวอักษร
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            marginBottom: '25px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: rating > 0 && comment.trim().length > 0 ? '#52c41a' : '#1890ff',
              width: `${((rating > 0 ? 50 : 0) + (comment.trim().length > 0 ? 50 : 0))}%`,
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '25px 40px',
          borderTop: '2px solid #f0f0f0',
          backgroundColor: '#fafafa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8c8c8c'
          }}>
            รีวิวของคุณจะช่วยให้นักศึกษาคนอื่นได้รับข้อมูลที่เป็นประโยชน์
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={onClose}
              style={{
                borderRadius: '8px',
                height: '40px',
                paddingLeft: '20px',
                paddingRight: '20px',
                fontWeight: '600',
                border: '2px solid #d9d9d9'
              }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              disabled={rating === 0}
              style={{
                borderRadius: '8px',
                height: '40px',
                paddingLeft: '25px',
                paddingRight: '25px',
                fontWeight: '700',
                fontSize: '14px',
                background: rating === 0 
                  ? '#d9d9d9' 
                  : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                boxShadow: rating === 0 
                  ? 'none' 
                  : '0 4px 12px rgba(24, 144, 255, 0.3)',
                transform: rating === 0 ? 'none' : 'translateY(-1px)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'กำลังส่ง...' : 'ส่งรีวิว'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModalContainer;