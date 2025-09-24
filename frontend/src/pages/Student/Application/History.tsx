import React, { useState, useEffect, useRef } from 'react';
import { Layout, Table, Tag, Button, Space, Modal, Input, Select, Card, message } from 'antd';
import { StarOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { type ApplicationInterface } from '../../../interface/IApplication';
import { GetApplicationById, GetApplicationsByStudentID } from '../../../services/https/Application';
import { GetStudentByUserId } from '../../../services/https';
import CoopMatchHeader from '../../Component/Coop_MatchHeader';
import dayjs from 'dayjs';
import ReviewModalContainer from '../Review/Review';

// ----------------- helper สำหรับประกอบลิงก์ไฟล์อย่างปลอดภัย -----------------
// ใช้ฐาน API จากตัวแปรแวดล้อม ถ้าไม่ตั้งให้ fallback เป็น local dev
const getApiBase = () => {
  const base = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:8080';
  return String(base).replace(/\/$/, '');
};
const toFileURL = (p?: string | null) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const safePath = encodeURI(p);
  return `${getApiBase()}${safePath.startsWith('/') ? '' : '/'}${safePath}`;
};
// -------------------------------------------------------------------------------

type Status = 'รอนัดสัมภาษณ์' | 'นัดสัมภาษณ์แล้ว' | 'กำลังพิจารณา' | 'ไม่ผ่าน' | 'ผ่าน';

const statusColors: Record<Status, string> = {
  'รอนัดสัมภาษณ์': 'green',
  'นัดสัมภาษณ์แล้ว': 'blue',
  'กำลังพิจารณา': 'orange',
  'ไม่ผ่าน': 'red',
  'ผ่าน': 'green',
};

type DetailResponse = {
  application: any;
  formatted_date?: string;
  interview_appointment?: {
    appointment_date?: string;
    mode?: string;
    details?: string;
    status?: string;
  };
};

const ApplicationHistory: React.FC = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationInterface[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationInterface[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailResponse | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [reviewCompanyId, setReviewCompanyId] = useState<number | null>(null);

  // สำหรับโหลด post_id เมื่อคลิก และแคชผลลัพธ์
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const postIdCache = useRef<Record<number, number>>({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userId = localStorage.getItem('id');
        if (!userId) return;

        const studentRes = await GetStudentByUserId(Number(userId));
        const sid = studentRes.ID;

        if (!sid) {
          message.error("ไม่พบข้อมูลนักศึกษา");
          return;
        }

        setStudentId(sid);

        const response = await GetApplicationsByStudentID(Number(sid));

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
      const response = await GetApplicationById(record.id!);
      if (response?.status === 200) {
        const data: DetailResponse = response.data;
        setSelectedDetail(data);
        setIsModalVisible(true);
      } else {
        message.error("ไม่พบข้อมูลการสมัครนี้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลการสมัคร");
    }
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleSearch = () => {
    const filtered = applications.filter((application) =>
      (application.company_name ?? '').toLowerCase().includes(companySearch.toLowerCase()) &&
      (application.position ?? '').toLowerCase().includes(positionSearch.toLowerCase()) &&
      (statusSearch === '' || (application.status ?? '').toLowerCase().includes(statusSearch.toLowerCase()))
    );
    setFilteredApplications(filtered);
  };

  const openReviewModal = (companyId: number) => {
    setReviewCompanyId(companyId);
    setReviewOpen(true);
  };
  const closeReviewModal = () => setReviewOpen(false);
  const handleReviewSuccess = () => message.success("ขอบคุณสำหรับการรีวิว!");

  // ✅ ดึง post_id จาก backend แล้ว navigate (มีแคช)
  const handleOpenPost = async (rec: ApplicationInterface) => {
    const appId = rec.id;
    if (!appId) return message.error('ไม่พบรหัสใบสมัคร');

    const cached = postIdCache.current[appId];
    if (typeof cached === 'number') {
      navigate(`/student/post-student/${cached}`);
      return;
    }

    try {
      setLoadingRowId(appId);
      const res = await GetApplicationById(appId);
      const postId =
        res?.data?.post_id ??
        res?.data?.application?.IntershipPostID ??
        res?.data?.application?.IntershipPost?.ID;

      if (typeof postId === 'number') {
        postIdCache.current[appId] = postId;
        navigate(`/student/post-student/${postId}`);
      } else {
        message.error('ไม่พบรหัสโพสต์จากเซิร์ฟเวอร์');
      }
    } catch {
      message.error('ดึงข้อมูลโพสต์ไม่สำเร็จ');
    } finally {
      setLoadingRowId(null);
    }
  };

  const columns = [
    {
      title: 'ตำแหน่งที่สมัคร',
      dataIndex: 'position',
      key: 'position',
      render: (text: string, record: ApplicationInterface) => (
        <Button
          type="link"
          loading={loadingRowId === record.id}
          onClick={() => handleOpenPost(record)}
          style={{
            color: '#1976d2',
            fontWeight: 500,
            fontSize: '14px',
            padding: 0,
            height: 'auto',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1565c0';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#1976d2';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'บริษัท',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string) => <div style={companyCellStyle}>{text}</div>,
    },
    {
      title: 'วันที่สมัคร',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => <div style={dateCellStyle}>{text}</div>,
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
      title: 'การดำเนินการ',
      key: 'action',
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

          {application.status === 'ผ่าน' && (
            <Button
              type="primary"
              icon={<StarOutlined />}
              size="small"
              onClick={() => openReviewModal(application.company_id!)}
              style={reviewButtonStyle}
            >
              ให้คะแนนรีวิว
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafb' }}>
      <Layout.Header style={headerWrapperStyle}>
        <CoopMatchHeader />
      </Layout.Header>

      <Layout.Content style={contentStyle}>
        <div style={containerStyle}>
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
              columns={columns as any}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
              }}
              rowKey="id"
              style={tableStyle}
            />
          </Card>

          <ApplicationDetailModal
            visible={isModalVisible}
            onClose={handleCancel}
            detail={selectedDetail}
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
      </Layout.Content>
    </Layout>
  );
};

const ApplicationDetailModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  detail: DetailResponse | null;
}> = ({ visible, onClose, detail }) => {
  const app = detail?.application ?? {};
  const interview = detail?.interview_appointment;

  const resumeURL = toFileURL(app?.resume_url ?? app?.resume ?? app?.ResumeUrl ?? '');
  const transcriptURL = toFileURL(app?.TranscriptUrl ?? app?.transcript ?? app?.transcript_url ?? '');

  const dt = interview?.appointment_date ? dayjs(interview.appointment_date) : null;
  const hasValidDate = dt ? dt.isValid() : false;
  const interviewDate = hasValidDate ? dt!.format('DD/MM/YYYY') : '-';
  const interviewTime = hasValidDate ? dt!.format('HH:mm') : '-';

  const submittedDate =
    detail?.formatted_date
      ? dayjs(detail.formatted_date, 'DD-MM-YYYY HH:mm').format('DD/MM/YYYY')
      : app?.submit_at
      ? dayjs(app.submit_at).format('DD/MM/YYYY')
      : '-';

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 40, padding: 0, backgroundColor: 'transparent' }}
      styles={{ body: { padding: 0, backgroundColor: 'unset' } }}
    >
      <div style={modalContainerStyle}>
        {detail && (
          <div style={{ backgroundColor: '#f8fbff', minHeight: '600px' }}>
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>📄 รายละเอียดการสมัครงาน</div>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>ตำแหน่งที่สมัคร:</span>
                <span style={detailValueStyle}>{app?.IntershipPost?.post_name || '-'}</span>
              </div>

              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>บริษัท:</span>
                <span style={detailValueStyle}>{app?.IntershipPost?.Company?.company_name || '-'}</span>
              </div>

              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>วันที่สมัคร:</span>
                <span style={detailValueStyle}>{submittedDate}</span>
              </div>

              <div style={{ marginTop: '30px' }}>
                <div style={detailLabelStyle}>เอกสารแนบ:</div>
                <div style={{ marginTop: '15px' }}>
                  <div style={fileItemStyle}>
                    {resumeURL ? (
                      <a href={resumeURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                        📎 ดูไฟล์ Resume
                      </a>
                    ) : (
                      <span style={fileNameStyle}>📄 Resume -</span>
                    )}
                  </div>

                  <div style={fileItemStyle}>
                    {transcriptURL ? (
                      <a href={transcriptURL} target="_blank" rel="noopener noreferrer" style={fileLinkStyle}>
                        📎 ดูไฟล์ Transcript
                      </a>
                    ) : (
                      <span style={fileNameStyle}>📊 Transcript -</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>สถานะปัจจุบัน:</span>
                  <span style={{ ...detailValueStyle, fontWeight: 'bold' }}>{app?.status || '-'}</span>
                </div>

                {app?.status === 'นัดสัมภาษณ์แล้ว' && (
                  <>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>วันสัมภาษณ์:</span>
                      <span style={detailValueStyle}>{interviewDate}</span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>เวลา:</span>
                      <span style={detailValueStyle}>{interviewTime}</span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>ช่องทาง:</span>
                      <span style={detailValueStyle}>{interview?.mode || '-'}</span>
                    </div>
                    {interview?.details && (
                      <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>หมายเหตุ:</span>
                        <span style={detailValueStyle}>{interview.details}</span>
                      </div>
                    )}
                  </>
                )}

                {app?.status !== 'ไม่ผ่าน' && app?.company_note && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={detailLabelStyle}>หมายเหตุจากบริษัท:</div>
                    <div style={companyNoteStyle}>{app.company_note}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={modalFooterStyle}>
              <Button onClick={onClose} style={closeButtonStyle}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ---------- Styles ----------
const headerWrapperStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  padding: 0,
  background: 'transparent',
};

const contentStyle: React.CSSProperties = {};

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

const searchIconStyle = { fontSize: '20px', color: '#0066cc', marginRight: '10px' };

const searchTitleStyle = { fontSize: '18px', fontWeight: 'bold', color: '#0066cc' };

const searchFieldsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  alignItems: 'end',
};

const searchFieldStyle = { display: 'flex', flexDirection: 'column' as const };

const labelStyle = { fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' };

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

const tableStyle = { backgroundColor: 'transparent' };
const companyCellStyle = { fontSize: '15px', fontWeight: 500, color: '#3399ff' };

const dateCellStyle = { fontSize: '14px', color: '#666' };

const statusTagStyle = { fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' };

const viewButtonStyle = {
  borderRadius: '8px',
  height: '36px',
  fontSize: '13px',
  fontWeight: 500,
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

const detailRowStyle = { display: 'flex', marginBottom: '18px', alignItems: 'flex-start' };

const detailLabelStyle = { fontSize: '15px', fontWeight: 600, color: '#555', minWidth: '160px', paddingRight: '15px' };

const detailValueStyle = { fontSize: '15px', color: '#333', flex: 1, lineHeight: '1.5' };

const fileItemStyle = {
  backgroundColor: 'rgba(255,255,255,0.8)',
  border: '2px solid #e1f0ff',
  borderRadius: '10px',
  padding: '12px 18px',
  marginBottom: '10px',
  transition: 'all 0.3s ease',
  cursor: 'pointer' as const,
};

const fileNameStyle = { fontSize: '14px', color: '#333', fontWeight: 500 };

const fileLinkStyle = { fontSize: '14px', color: '#1976d2', textDecoration: 'none', fontWeight: 500 };

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
