import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Select, Card, message } from 'antd';
import { type ApplicationInterface } from '../../../interface/IApplication';
import { GetApplicationById, GetApplicationsByStudentID } from '../../../services/https/Application';
import { GetStudentByUserId } from '../../../services/https';
import CoopMatchHeaderDefault from '../../component/CoopMatchHeaderDefault';
import CoopMatchHeader from '../../Component/CoopMatchHeader';

// กำหนดประเภทของสถานะ
type Status = 'รอนัดสัมภาษณ์' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก';

// กำหนดสีของสถานะต่างๆ
const statusColors: Record<Status, string> = {
  'รอนัดสัมภาษณ์': 'green',
  'กำลังพิจารณา': 'orange',
  'ไม่ได้รับเลือก': 'red',
};

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationInterface[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationInterface[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userId = localStorage.getItem('id');
        if (!userId) return;

        // ✅ แก้ตรงนี้ ดึงข้อมูล student โดยใช้ user_id
        const studentRes = await GetStudentByUserId(Number(userId));
        console.log("🎓 Student:", studentRes);
        const studentId = studentRes.ID;

        if (!studentId) {
          message.error("ไม่พบข้อมูลนักศึกษา");
          return;
        }

        const response = await GetApplicationsByStudentID(Number(studentId));
        console.log("📦 API Response:", response);
        console.log("📦 Data:", response.data);

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

  const columns = [
    {
      title: 'ตำแหน่งที่สมัคร',
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => (
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0066cc' }}>{text}</div>
      ),
    },
    {
      title: 'บริษัท',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string) => (
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#3399ff' }}>{text}</div>
      ),
    },
    {
      title: 'วันที่สมัคร',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: Status) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: ApplicationInterface) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetails(record)} style={buttonStyle}>
            ดูรายละเอียด
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={containerStyle}>
      <CoopMatchHeader/>
      <h2 style={headingStyle}>ประวัติการสมัคร</h2>

      <Card style={searchCardStyle}>
        <div style={searchFieldsStyle}>
          <div style={labelStyle}>ค้นหาชื่อบริษัท</div>
          <Input
            placeholder="ค้นหาชื่อบริษัท"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            onPressEnter={handleSearch}
            style={inputStyle}
          />

          <div style={labelStyle}>ค้นหาตำแหน่ง</div>
          <Input
            placeholder="ค้นหาตำแหน่ง"
            value={positionSearch}
            onChange={(e) => setPositionSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={inputStyle}
          />

          <div style={labelStyle}>ค้นหาสถานะ</div>
          <Select
            placeholder="ค้นหาสถานะ"
            value={statusSearch}
            onChange={setStatusSearch}
            onBlur={handleSearch}
            style={inputStyle}
          >
            <Select.Option value="">ทั้งหมด</Select.Option>
            <Select.Option value="รอนัดสัมภาษณ์">รอนัดสัมภาษณ์</Select.Option>
            <Select.Option value="กำลังพิจารณา">กำลังพิจารณา</Select.Option>
            <Select.Option value="ไม่ได้รับเลือก">ไม่ได้รับเลือก</Select.Option>
          </Select>
        </div>
      </Card>

      <Table dataSource={filteredApplications} columns={columns} pagination={false} rowKey="id" />
      <ApplicationDetailModal
        visible={isModalVisible}
        onClose={handleCancel}
        application={selectedApplication}
      />
    </div>
  );
};

const ApplicationDetailModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  application: ApplicationInterface | null;
}> = ({ visible, onClose, application }) => {
  const statusColors: Record<string, string> = {
    'กำลังพิจารณา': 'orange',
    'รอนัดสัมภาษณ์': 'green',
    'ไม่ได้รับเลือก': 'red',
  };

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
      width={600} // หรือขนาดที่ต้องการ
      style={{ top: 40, padding: 0, backgroundColor: 'transparent' }} // ไม่มีพื้นหลังนอกเนื้อหา
      bodyStyle={{
        padding: 0, // ❌ ไม่มี padding ขอบ
        backgroundColor: 'unset', // ❌ ไม่มีพื้นหลังขาว
      }}
    >
      <div style={{
        backgroundColor: '#f5f5f5', // ✅ กล่องเนื้อหาหลักที่คุณควบคุม
        borderRadius: '12px',       // หรือไม่ใส่ก็ได้
        overflow: 'hidden'          // ป้องกันหลุดจากมุมโค้ง
      }}>

        {application && (
          <div style={{ backgroundColor: '#f5f5f5', minHeight: '600px' }}>
            {/* Header */}
            <div style={{

              backgroundColor: 'rgb(175, 213, 244)',
              padding: '20px 30px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center'
            }}>
              รายละเอียดการสมัคร
            </div>

            {/* Content */}
            <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
              {/* Left Content */}
              <div style={{ flex: 1 }}>
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
                  <div style={{ marginTop: '10px' }}>
                    {resumeURL ? (
                      <div style={fileItemStyle}>
                        <a href={resumeURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                          Resume.pdf
                        </a>
                      </div>
                    ) : (
                      <div style={fileItemStyle}>
                        <span style={fileNameStyle}>Resume.pdf</span>
                      </div>
                    )}

                    {transcriptURL ? (
                      <div style={fileItemStyle}>
                        <a href={transcriptURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                          Transcript.pdf
                        </a>
                      </div>
                    ) : (
                      <div style={fileItemStyle}>
                        <span style={fileNameStyle}>Transcript.pdf</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>สถานะสำคัญ:</span>
                    <span style={{
                      ...detailValueStyle,
                      color: application.status === 'รอนัดสัมภาษณ์' ? '#28a745' :
                        application.status === 'กำลังพิจารณา' ? '#8B4513' : '#dc3545',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {application.status === 'รอนัดสัมภาษณ์' && '🏆 รอนัดสัมภาษณ์'}
                      {application.status === 'กำลังพิจารณา' && '🔍 กำลังพิจารณา'}
                      {application.status === 'ไม่ได้รับเลือก' && '❌ ไม่ได้ผ่านการคัดเลือก'}
                    </span>
                  </div>

                  {/* แสดงข้อมูลตามสถานะ */}
                  {application.status === 'รอนัดสัมภาษณ์' && (
                    <>
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>นัดสัมภาษณ์:</span>
                        <span style={detailValueStyle}>วันที่: {application.formatted_date}</span>
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

                  {application.status === 'ไม่ได้รับเลือก' && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>หมายเหตุจากบริษัท:</span>
                      <span style={detailValueStyle}>
                        {application.companyNote || '"คุณสมบัติยังไม่ตรงตามที่ กำหนดขณะนี้ต้องการ..."'}
                      </span>
                    </div>
                  )}

                  {application.status === 'ผ่านการคัดเลือก' && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>สถานะ:</span>
                      <span style={{ ...detailValueStyle, color: '#28a745', fontWeight: 'bold' }}>
                        ✅ ผ่านการคัดเลือก
                      </span>
                    </div>
                  )}

                  {/* แสดงหมายเหตุจากบริษัท (ถ้ามี) สำหรับทุกสถานะ ยกเว้น "ไม่ได้รับเลือก" ที่แสดงแล้วข้างบน */}
                  {application.status !== 'ไม่ได้รับเลือก' && application.companyNote && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={detailLabelStyle}>หมายเหตุจากบริษัท:</div>
                      <div style={{
                        marginTop: '10px',
                        padding: '15px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {application.companyNote}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 30px',
              textAlign: 'center',
              borderTop: '2px solid #ddd'
            }}>
              <Button
                onClick={onClose}
                style={{
                  backgroundColor: 'rgb(175, 213, 244)',

                  border: 'none',
                  padding: '8px 30px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ปิด
              </Button>
            </div>
          </div>
        )}
        </div>
    </Modal>
  );
};

// Existing styles
const containerStyle = {
  backgroundColor: '#e6f7ff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const headingStyle = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#0066cc',
  marginBottom: '40px',
};

const buttonStyle = {
  backgroundColor: '#0066cc',
  color: 'white',
  borderRadius: '6px',
  padding: '10px 20px',
  fontWeight: 'bold',
};

const searchCardStyle = {
  marginBottom: '20px',
  padding: '15px',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  backgroundColor: '#AFD5F4',
};

const searchFieldsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '20px',
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  marginBottom: '0px',
  display: 'block',
};

const inputStyle = {
  width: '20%',
  marginTop: '0',
};

// New modal styles
const detailRowStyle = {
  display: 'flex',
  marginBottom: '15px',
  alignItems: 'flex-start'
};

const detailLabelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#555',
  minWidth: '150px',
  paddingRight: '10px'
};

const detailValueStyle = {
  fontSize: '14px',
  color: '#333',
  flex: 1
};

const fileItemStyle = {
  backgroundColor: 'white',
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '10px 15px',
  marginBottom: '8px',
  cursor: 'pointer'
};

const fileNameStyle = {
  fontSize: '14px',
  color: '#333'
};

const fileLinkStyle = {
  fontSize: '14px',
  color: '#1976d2',
  textDecoration: 'none'
};



export default ApplicationHistory;