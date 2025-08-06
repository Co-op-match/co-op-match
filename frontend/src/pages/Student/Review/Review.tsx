import React, { useState, useEffect } from "react";
import { Modal, Rate, Input, Button, message, Select } from "antd";
import { StarFilled, HeartFilled, MessageOutlined, TagOutlined } from "@ant-design/icons";
import { CreateReview } from "../../../services/https";
import type { ReviewPayload } from "../../../interface/IReview";
import type { Tag } from "../../../interface/ITag";
import { GetAllTags } from "../../../services/https/Application";

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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
      setSelectedTags([]);
      GetAllTags().then((res: { data: Tag[] }) => {
        if (res && res.data) {
          setAvailableTags(res.data);
        }
      });
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
        tags: selectedTags,
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

  const calculateProgress = () => {
    let progress = 0;
    if (rating > 0) progress += 40;
    if (comment.trim().length > 0) progress += 30;
    if (selectedTags.length > 0) progress += 30;
    return progress;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      title={null}
      style={{ padding: 0 }}
      bodyStyle={{ padding: 0 }}
      destroyOnClose={true}
    >
      <div style={{
        backgroundColor: '#f8f9fa',
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
          padding: '28px 35px',
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
        <div style={{ padding: '30px 40px' }}>

          {/* Rating Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
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

          {/* Tags Section - Moved up */}
          <div style={{
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '15px'
            }}>
              <TagOutlined style={{ color: '#1890ff' }} />
              <span>แท็กที่เกี่ยวข้อง</span>
            </div>

            <Select
              mode="multiple"
              allowClear
              placeholder="เลือกแท็กที่เกี่ยวข้องกับประสบการณ์ (ไม่บังคับ)"
              style={{
                width: '100%',
                minHeight: '42px'
              }}
              value={selectedTags.map(tag => tag.name)}
              onChange={(values) => {
                const newTags: Tag[] = values.map((name) => ({ name }));
                setSelectedTags(newTags);
              }}
              options={availableTags.map(tag => ({ label: tag.name, value: tag.name }))}
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />

            <div style={{
              fontSize: '12px',
              color: '#8c8c8c',
              marginTop: '8px'
            }}>
              เลือกแท็กที่เหมาะสมเพื่อช่วยให้นักศึกษาคนอื่นค้นหาได้ง่ายขึ้น
            </div>
          </div>

          {/* Comment Section */}
          <div style={{
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '15px'
            }}>
              <MessageOutlined style={{ color: '#1890ff' }} />
              <span>เล่าประสบการณ์ของคุณ</span>
              <span style={{ color: '#ff4d4f', fontSize: '12px' }}>*</span>
            </div>

            <Input.TextArea
              rows={5}
              placeholder="• เล่าเกี่ยวกับสภาพแวดล้อมการทำงาน&#10;• ความเป็นมิตรของเพื่อนร่วมงาน&#10;• ความรู้ที่ได้รับ&#10;• คำแนะนำสำหรับนักศึกษาคนต่อไป&#10;• ข้อดีข้อเสียของการฝึกงานที่นี่"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              showCount
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
              marginTop: '8px'
            }}>
              ความคิดเห็นที่ละเอียดจะช่วยให้นักศึกษาคนอื่นได้รับข้อมูลที่เป็นประโยชน์มากขึ้น
            </div>
          </div>
        </div>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex', // ✅ ทำให้ลูกอยู่ในแนวเดียว
          justifyContent: 'center', // ✅ จัดลูกให้อยู่ตรงกลางแนวนอน
          marginBottom: '30px'
        }}>
          <div style={{
            width: '90%',
            height: '6px',
            backgroundColor: '#e8e8e8',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: calculateProgress() === 100 ? '#52c41a' : '#1890ff',
              width: `${calculateProgress()}%`,
              transition: 'width 0.3s ease, background-color 0.3s ease',
              borderRadius: '3px'
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
            color: '#8c8c8c',
            maxWidth: '60%'
          }}>
            รีวิวของคุณจะช่วยให้นักศึกษาคนอื่นได้รับข้อมูลที่เป็นประโยชน์
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={onClose}
              style={{
                borderRadius: '8px',
                height: '42px',
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
                height: '42px',
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