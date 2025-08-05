import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Select, Card, message } from 'antd';
import { StarOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { type ApplicationInterface } from '../../../interface/IApplication';
import { GetApplicationById, GetApplicationsByStudentID, GetInterviewAppointmentByStudentAndCompany } from '../../../services/https/Application';
import { GetStudentByUserId } from '../../../services/https';
import CoopMatchHeader from '../../component/Coop_MatchHeader';
import dayjs from 'dayjs';
import ReviewModalContainer from '../Review/Review';

// กำหนดประเภทของสถานะ
type Status = 'รอนัดสัมภาษณ์' | 'นัดสัมภาษณ์แล้ว' | 'กำลังพิจารณา' | 'ไม่ผ่าน' | 'ผ่าน'

// กำหนดสีของสถานะต่างๆ
const statusColors: Record<Status, string> = {
  'รอนัดสัมภาษณ์': 'green',
  'นัดสัมภาษณ์แล้ว': 'blue',
  'กำลังพิจารณา': 'orange',
  'ไม่ผ่าน': 'red',
  'ผ่าน': 'green',
};

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationInterface[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationInterface[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [interviewInfo, setInterviewInfo] = useState<any>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [reviewCompanyId, setReviewCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userId = localStorage.getItem('id');
        if (!userId) return;

        const studentRes = await GetStudentByUserId(Number(userId));
        const studentId = studentRes.ID;

        if (!studentId) {
          message.error("ไม่พบข้อมูลนักศึกษา");
          return;
        }

        setStudentId(studentId);

        const response = await GetApplicationsByStudentID(Number(studentId));

        if (response?.status === 200) {
          setApplications(response.data);
          setFilteredApplications(response.data);
        } else {
          message.error("ไม่พบข้อมูลการสมัครของคุณ");
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
    };

    fetchApplications();
  }, []);

  useEffect(() => {
    const fetchInterviewInfo = async () => {
      if (selectedApplication?.StudentID && selectedApplication?.IntershipPost?.Company?.ID) {
        const result = await GetInterviewAppointmentByStudentAndCompany(
          selectedApplication.StudentID,
          selectedApplication.IntershipPost.Company.ID
        );
        setInterviewInfo(result);
      }
    };

    fetchInterviewInfo();
  }, [selectedApplication]);

  const handleViewDetails = async (record: ApplicationInterface) => {
    try {
      const response = await GetApplicationById(record.id!)
      if (response?.status === 200) {
        setSelectedApplication(response.data);
        setIsModalVisible(true);
      } else {
        message.error("ไม่พบข้อมูลการสมัครนี้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลการสมัคร");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSearch = () => {
    const filtered = applications.filter((application) =>
      application.company_name?.toLowerCase().includes(companySearch.toLowerCase()) &&
      application.position.toLowerCase().includes(positionSearch.toLowerCase()) &&
      (statusSearch === '' || application.status.toLowerCase().includes(statusSearch.toLowerCase()))
    );
    setFilteredApplications(filtered);
  };

  const openReviewModal = (companyId: number) => {
    setReviewCompanyId(companyId);
    setReviewOpen(true);
  };

  const closeReviewModal = () => {
    setReviewOpen(false);
  };

  const handleReviewSuccess = () => {
    message.success("ขอบคุณสำหรับการรีวิว!");
  };

  const columns = [
    {
      title: 'ตำแหน่งที่สมัคร',
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => (
        <div style={positionCellStyle}>{text}</div>
      ),
    },
    {
      title: 'บริษัท',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string) => (
        <div style={companyCellStyle}>{text}</div>
      ),
    },
    {
      title: 'วันที่สมัคร',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => (
        <div style={dateCellStyle}>{text}</div>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: Status) => (
        <Tag color={statusColors[status]} style={statusTagStyle}>
          {status}
        </Tag>
      ),
    },
    {
      title: "การดำเนินการ",
      key: "action",
      render: (_: any, application: ApplicationInterface) => (
        <Space size={8}>
          <Button 
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(application)}
            style={viewButtonStyle}
          >
            ดูรายละเอียด
          </Button>

          {application.status === "ผ่าน" && (
            <Button
              type="primary"
              icon={<StarOutlined />}
              size="small"
              onClick={() => openReviewModal(application.id!)}
              style={reviewButtonStyle}
            >
              ให้คะแนนรีวิว
            </Button>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div style={containerStyle}>
      <CoopMatchHeader />
      
      <div style={titleContainerStyle}>
        <h2 style={headingStyle}>📋 ประวัติการสมัครงาน</h2>
        <div style={subtitleStyle}>ติดตามสถานะการสมัครและผลการพิจารณาของคุณ</div>
      </div>

      <Card style={searchCardStyle}>
        <div style={searchHeaderStyle}>
          <SearchOutlined style={searchIconStyle} />
          <span style={searchTitleStyle}>ค้นหาข้อมูลการสมัคร</span>
        </div>
        
        <div style={searchFieldsStyle}>
          <div style={searchFieldStyle}>
            <div style={labelStyle}>ชื่อบริษัท</div>
            <Input
              placeholder="ค้นหาชื่อบริษัท"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              onPressEnter={handleSearch}
              style={inputStyle}
            />
          </div>

          <div style={searchFieldStyle}>
            <div style={labelStyle}>ตำแหน่งงาน</div>
            <Input
              placeholder="ค้นหาตำแหน่ง"
              value={positionSearch}
              onChange={(e) => setPositionSearch(e.target.value)}
              onPressEnter={handleSearch}
              style={inputStyle}
            />
          </div>

          <div style={searchFieldStyle}>
            <div style={labelStyle}>สถานะ</div>
            <Select
              placeholder="เลือกสถานะ"
              value={statusSearch}
              onChange={setStatusSearch}
              onBlur={handleSearch}
              style={inputStyle}
            >
              <Select.Option value="">ทั้งหมด</Select.Option>
              <Select.Option value="รอนัดสัมภาษณ์">รอนัดสัมภาษณ์</Select.Option>
              <Select.Option value="กำลังพิจารณา">กำลังพิจารณา</Select.Option>
              <Select.Option value="ไม่ได้รับเลือก">ไม่ได้รับเลือก</Select.Option>
              <Select.Option value="นัดสัมภาษณ์แล้ว">นัดสัมภาษณ์แล้ว</Select.Option>
              <Select.Option value="ผ่านการคัดเลือก">ผ่านการคัดเลือก</Select.Option>
            </Select>
          </div>

          <div style={searchFieldStyle}>
            <div style={{ ...labelStyle, opacity: 0 }}>ค้นหา</div>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={searchButtonStyle}
            >
              ค้นหา
            </Button>
          </div>
        </div>
      </Card>

      <Card style={tableCardStyle}>
        <Table 
          dataSource={filteredApplications} 
          columns={columns} 
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
          }} 
          rowKey="id"
          style={tableStyle}
        />
      </Card>

      <ApplicationDetailModal
        visible={isModalVisible}
        onClose={handleCancel}
        application={selectedApplication}
      />

      {reviewOpen && studentId !== null && reviewCompanyId !== null && (
        <ReviewModalContainer
          open={reviewOpen}
          onClose={closeReviewModal}
          studentId={studentId}
          companyId={reviewCompanyId}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

const ApplicationDetailModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  application: ApplicationInterface | null;
}> = ({ visible, onClose, application }) => {

  const fileBaseURL = 'http://localhost:8000';

  const resumeURL = application?.resume_url
    ? `${fileBaseURL}${application.resume_url}`
    : '';

  const transcriptURL = application?.TranscriptUrl
    ? `${fileBaseURL}${application.TranscriptUrl}`
    : '';

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 40, padding: 0, backgroundColor: 'transparent' }}
      bodyStyle={{
        padding: 0,
        backgroundColor: 'unset',
      }}
    >
      <div style={modalContainerStyle}>
        {application && (
          <div style={{ backgroundColor: '#f8fbff', minHeight: '600px' }}>
            {/* Header */}
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>📄 รายละเอียดการสมัครงาน</div>
            </div>

            {/* Content */}
            <div style={{ padding: '30px' }}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>ตำแหน่งที่สมัคร:</span>
                <span style={detailValueStyle}>{application.IntershipPost?.post_name || 'Frontend Developer'}</span>
              </div>

              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>บริษัท:</span>
                <span style={detailValueStyle}>{application.IntershipPost?.Company?.company_name || 'ABC Tech Co., Ltd.'}</span>
              </div>

              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>วันที่สมัคร:</span>
                <span style={detailValueStyle}>{application.formatted_date || '05/05/2025'}</span>
              </div>

              <div style={{ marginTop: '30px' }}>
                <div style={detailLabelStyle}>เอกสารแนบ:</div>
                <div style={{ marginTop: '15px' }}>
                  {resumeURL ? (
                    <div style={fileItemStyle}>
                      <a href={resumeURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                        📄 Resume.pdf
                      </a>
                    </div>
                  ) : (
                    <div style={fileItemStyle}>
                      <span style={fileNameStyle}>📄 Resume.pdf</span>
                    </div>
                  )}

                  {transcriptURL ? (
                    <div style={fileItemStyle}>
                      <a href={transcriptURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                        📊 Transcript.pdf
                      </a>
                    </div>
                  ) : (
                    <div style={fileItemStyle}>
                      <span style={fileNameStyle}>📊 Transcript.pdf</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>สถานะปัจจุบัน:</span>
                  <span style={{
                    ...detailValueStyle,
                    color: application.status === 'รอนัดสัมภาษณ์' ? '#28a745' :
                      application.status === 'กำลังพิจารณา' ? '#8B4513' :
                        application.status === 'ผ่าน' ? '#28a745' : '#dc3545',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {application.status === 'รอนัดสัมภาษณ์' && '🏆 รอนัดสัมภาษณ์'}
                    {application.status === 'นัดสัมภาษณ์แล้ว' && '📅 นัดสัมภาษณ์แล้ว'}
                    {application.status === 'กำลังพิจารณา' && '🔍 กำลังพิจารณา'}
                    {application.status === 'ไม่ผ่าน' && '❌ ไม่ได้ผ่านการคัดเลือก'}
                    {application.status === 'ผ่าน' && '✅ ผ่านการคัดเลือก'}
                  </span>
                </div>

                {application.status === 'นัดสัมภาษณ์แล้ว' && (
                  <>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>วันสัมภาษณ์:</span>
                      <span style={detailValueStyle}>
                        {application.interview_appointment?.appointment_date
                          ? dayjs(application.interview_appointment.appointment_date).format("DD-MM-YYYY HH:mm")
                          : "-"}
                      </span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>ช่องทาง:</span>
                      <span style={detailValueStyle}>
                        {application.interview_appointment?.mode || "-"}
                      </span>
                    </div>
                  </>
                )}

                {application.status === 'กำลังพิจารณา' && (
                  <>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>ประวัติการดำเนินการ:</span>
                      <span style={detailValueStyle}>สมัครเรียบร้อย ({application.formatted_date})</span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}></span>
                      <span style={detailValueStyle}>อยู่ระหว่างการพิจารณาโดยบริษัท</span>
                    </div>
                  </>
                )}

                {application.status === 'ไม่ผ่าน' && (
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>หมายเหตุจากบริษัท:</span>
                    <span style={detailValueStyle}>
                      {application.company_note || '"คุณสมบัติยังไม่ตรงตามที่กำหนดขณะนี้ต้องการ..."'}
                    </span>
                  </div>
                )}

                {application.status === 'ผ่าน' && (
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>สถานะ:</span>
                    <span style={{ ...detailValueStyle, color: '#28a745', fontWeight: 'bold' }}>
                      ✅ ผ่านการคัดเลือก - สามารถเริ่มฝึกงานได้
                    </span>
                  </div>
                )}

                {application.status !== 'ไม่ผ่าน' && application.company_note && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={detailLabelStyle}>หมายเหตุจากบริษัท:</div>
                    <div style={companyNoteStyle}>
                      {application.company_note}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={modalFooterStyle}>
              <Button
                onClick={onClose}
                style={closeButtonStyle}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Enhanced Styles
const containerStyle = {
  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%)',
  minHeight: '100vh',
  padding: '20px',
};

const titleContainerStyle = {
  textAlign: 'center' as const,
  marginBottom: '30px',
  padding: '20px',
};

const headingStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#0066cc',
  marginBottom: '10px',
  textShadow: '2px 2px 4px rgba(0,102,204,0.1)',
};

const subtitleStyle = {
  fontSize: '16px',
  color: '#666',
  fontStyle: 'italic',
};

const searchCardStyle = {
  marginBottom: '25px',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  background: 'linear-gradient(135deg, #AFD5F4 0%, #87CEEB 100%)',
  border: 'none',
};

const searchHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '2px solid rgba(255,255,255,0.3)',
};

const searchIconStyle = {
  fontSize: '20px',
  color: '#0066cc',
  marginRight: '10px',
};

const searchTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0066cc',
};

const searchFieldsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  alignItems: 'end',
};

const searchFieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  marginBottom: '8px',
};

const inputStyle = {
  borderRadius: '8px',
  border: '2px solid rgba(255,255,255,0.5)',
  backgroundColor: 'rgba(255,255,255,0.9)',
};

const searchButtonStyle = {
  height: '40px',
  borderRadius: '8px',
  backgroundColor: '#0066cc',
  borderColor: '#0066cc',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(0,102,204,0.3)',
};

const tableCardStyle = {
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  border: 'none',
  overflow: 'hidden',
};

const tableStyle = {
  backgroundColor: 'transparent',
};

// Table cell styles
const positionCellStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0066cc',
};

const companyCellStyle = {
  fontSize: '15px',
  fontWeight: '500',
  color: '#3399ff',
};

const dateCellStyle = {
  fontSize: '14px',
  color: '#666',
};

const statusTagStyle = {
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '4px 12px',
  borderRadius: '20px',
};

// Button styles
const viewButtonStyle = {
  borderRadius: '8px',
  height: '36px',
  fontSize: '13px',
  fontWeight: '500',
  backgroundColor: '#f8f9fa',
  borderColor: '#dee2e6',
  color: '#495057',
  marginRight: 60,
};

const reviewButtonStyle = {
  borderRadius: '20px',
  height: '32px',
  fontSize: '12px',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  borderColor: '#FFD700',
  color: '#333',
  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
  transition: 'all 0.3s ease',
};

// Modal styles
const modalContainerStyle = {
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
};

const modalHeaderStyle = {
  background: 'linear-gradient(135deg, #AFD5F4 0%, #87CEEB 100%)',
  padding: '25px 30px',
  textAlign: 'center' as const,
};

const modalTitleStyle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#0066cc',
  textShadow: '1px 1px 2px rgba(0,102,204,0.1)',
};

const detailRowStyle = {
  display: 'flex',
  marginBottom: '18px',
  alignItems: 'flex-start',
};

const detailLabelStyle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#555',
  minWidth: '160px',
  paddingRight: '15px',
};

const detailValueStyle = {
  fontSize: '15px',
  color: '#333',
  flex: 1,
  lineHeight: '1.5',
};

const fileItemStyle = {
  backgroundColor: 'rgba(255,255,255,0.8)',
  border: '2px solid #e1f0ff',
  borderRadius: '10px',
  padding: '12px 18px',
  marginBottom: '10px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
};

const fileNameStyle = {
  fontSize: '14px',
  color: '#333',
  fontWeight: '500',
};

const fileLinkStyle = {
  fontSize: '14px',
  color: '#1976d2',
  textDecoration: 'none',
  fontWeight: '500',
};

const companyNoteStyle = {
  marginTop: '12px',
  padding: '18px',
  backgroundColor: 'rgba(255,255,255,0.9)',
  border: '2px solid #e1f0ff',
  borderRadius: '12px',
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#555',
};

const modalFooterStyle = {
  padding: '25px 30px',
  textAlign: 'center' as const,
  borderTop: '2px solid #e1f0ff',
  backgroundColor: 'rgba(255,255,255,0.5)',
};

const closeButtonStyle = {
  backgroundColor: '#AFD5F4',
  border: 'none',
  padding: '10px 40px',
  borderRadius: '25px',
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#0066cc',
  boxShadow: '0 4px 12px rgba(175, 213, 244, 0.4)',
};

export default ApplicationHistory;