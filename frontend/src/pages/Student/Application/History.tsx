import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Select, Card, message } from 'antd';
import { GetApplications, GetApplicationById } from '../../../services/https/Application'; // ใช้ services สำหรับดึงข้อมูล
import { type ApplicationInterface } from '../../../interface/IApplication';

// export interface ApplicationInterface {
//   id?: number; // Optional ID
//   position: string; // Required position
//   status: 'ผ่านการคัดเลือก' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก'; // Status field with predefined values
//   companyNote?: string; // Optional company note
//   resume?: string; // Optional resume
//   transcript?: string; // Optional transcript
//   submit_at?: string; // Optional submission timestamp
//   internship_post_id?: number; // Optional internship post ID
// }
// กำหนดประเภทของสถานะ
type Status = 'รอนัดสัมภาษณ์' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก';

// กำหนดสีของสถานะต่างๆ
const statusColors: Record<Status, string> = {
  'รอนัดสัมภาษณ์': 'green',
  'กำลังพิจารณา': 'orange',
  'ไม่ได้รับเลือก': 'red',
};

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationInterface[]>([]);  // ใช้ ApplicationInterface
  const [filteredApplications, setFilteredApplications] = useState<ApplicationInterface[]>([]);  // ใช้ ApplicationInterface
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null); // ใช้ ApplicationInterface
  const [companySearch, setCompanySearch] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await GetApplications(); // ใช้ GetApplications จาก services
        if (response?.status === 200) {
          setApplications(response.data);
          setFilteredApplications(response.data);
        } else {
          message.error("เกิดข้อผิดพลาดในการดึงข้อมูลการสมัคร");
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
    };
    fetchApplications();
  }, []);

  const handleViewDetails = async (record: ApplicationInterface) => {  // ใช้ ApplicationInterface
    try {
      const response = await GetApplicationById(record.id!); // ใช้ GetApplicationById จาก services
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
      (application.company.toLowerCase().includes(companySearch.toLowerCase()) ||
        application.position.toLowerCase().includes(positionSearch.toLowerCase()) ||
        application.status.toLowerCase().includes(statusSearch.toLowerCase()))
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
      dataIndex: 'company',
      key: 'company',
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
      render: (_: any, record: ApplicationInterface) => (  // ใช้ ApplicationInterface
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
      <h2 style={headingStyle}>ประวัติการสมัคร</h2>

      {/* กล่องค้นหาสำหรับชื่อบริษัท, ตำแหน่ง, สถานะ */}
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

      <Table dataSource={filteredApplications} columns={columns} pagination={false} />
      <ApplicationDetailModal
        visible={isModalVisible}
        onClose={handleCancel}
        application={selectedApplication}
      />
    </div>
  );
};

// Modal สำหรับรายละเอียดการสมัคร
const ApplicationDetailModal: React.FC<{ visible: boolean; onClose: () => void; application: ApplicationInterface | null }> = ({ visible, onClose, application }) => {  // ใช้ ApplicationInterface
  const statusColors = {
    'กำลังพิจารณา': 'orange',
    'รอสัมภาษณ์': 'green',
    'ไม่ผ่านการคัดเลือก': 'red',
  };

  return (
    <Modal
      title="รายละเอียดการสมัคร"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} style={buttonStyle}>
          ปิด
        </Button>,
      ]}
      style={{ borderRadius: '12px' }}
    >
      {application && (
        <>
          <p><strong>ตำแหน่งที่สมัคร:</strong> {application.position}</p>
          <p><strong>บริษัท:</strong> {application.company}</p>
          <p><strong>วันที่สมัคร:</strong> {application.date}</p>
          <p><strong>สถานะ:</strong> <Tag color={statusColors[application.status]}>{application.status}</Tag></p>
          <p><strong>หมายเหตุจากบริษัท:</strong> {application.companyNote}</p>
          <ul>
            {application.resume && <li><a href={application.resume} target="_blank" rel="noopener noreferrer">Resume</a></li>}
            {application.transcript && <li><a href={application.transcript} target="_blank" rel="noopener noreferrer">Transcript</a></li>}
          </ul>
        </>
      )}
    </Modal>
  );
};

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

export default ApplicationHistory;
