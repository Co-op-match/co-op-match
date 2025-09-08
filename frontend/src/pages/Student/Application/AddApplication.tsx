import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AddApplication.css';
import {
  Form,
  Input,
  Button,
  Upload,
  Typography,
  message,
  Card,
  Row,
  Col,
  Tag,
  Steps,
  Alert,
  Result,
} from 'antd';
import {
  UploadOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  HomeOutlined,
  BookOutlined,
  BulbOutlined,
  FileTextOutlined,
  SendOutlined,
  CheckCircleOutlined,
  BuildOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { GetPostById, CreateApplication, GetApplicationsByStudentID } from '../../../services/https/Application';
import { GetStudentByUserId } from '../../../services/https/index';
import type { InternshipPostInterface } from '../../../interface/IIntershipPost';
import type { StudentInterface } from '../../../interfaces/Student';

const { Title, Text } = Typography;
const { Step } = Steps;

const AddApplication: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [post, setPost] = useState<InternshipPostInterface | null>(null);
  const [student, setStudent] = useState<StudentInterface | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  // ✅ state กันส่งซ้ำ
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('id');
    const postIdNumber = Number(postId);

    if (!userId || !postId || isNaN(postIdNumber)) return;

    const fetchData = async () => {
      try {
        const [postRes, studentRes] = await Promise.all([
          GetPostById(postIdNumber),
          GetStudentByUserId(Number(userId)),
        ]);
        setPost(postRes.data);
        setStudent(studentRes);

        // ✅ โหลดรายการสมัครของนักศึกษาเพื่อตรวจว่าซ้ำไหม
        try {
          const appsRes = await GetApplicationsByStudentID(Number(studentRes.ID));
          const list = appsRes?.data ?? [];
          const hasApplied = Array.isArray(list) && list.some((a: any) => {
            const pid =
              a?.IntershipPostID ??
              a?.intership_post_id ??
              a?.IntershipPost?.ID ??
              a?.post_id;
            return Number(pid) === postIdNumber;
          });
          setAlreadyApplied(hasApplied);
        } catch {
          // ถ้าดึงประวัติไม่สำเร็จ จะไม่บล็อคการสมัคร แต่ยังกันซ้ำฝั่ง backend
        }
      } catch (error) {
        message.error('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    };

    fetchData();
  }, [postId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // ✅ กันก่อนยิง API ถ้าเคยสมัครแล้ว
      if (alreadyApplied) {
        messageApi.warning({
          content: 'คุณได้สมัครตำแหน่งนี้ไว้แล้ว กรุณารอติดตามผลการพิจารณา',
          style: { marginTop: '20vh' }
        });
        return;
      }

      if (!resumeFile || !transcriptFile) {
        messageApi.warning({
          content: 'กรุณาอัปโหลดไฟล์เรซูเม่และทรานสคริปต์ให้ครบถ้วน',
          style: { marginTop: '20vh' }
        });
        return;
      }

      const postIdNumber = Number(postId);
      if (isNaN(postIdNumber)) {
        messageApi.error({
          content: 'ข้อมูลตำแหน่งไม่ถูกต้อง',
          style: { marginTop: '20vh' }
        });
        return;
      }

      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('transcript', transcriptFile);
      formData.append('status', 'กำลังพิจารณา');
      formData.append('submit_at', new Date().toISOString());
      formData.append('student_id', localStorage.getItem('id')!);
      formData.append('company_note', values.company_note || '');

      setLoading(true);
      const res = await CreateApplication(postIdNumber, formData);

      if (res.status === 200 || res.status === 201) {
        setCurrentStep(3);
        setAlreadyApplied(true);
        messageApi.success({
          content: 'ระบบได้รับใบสมัครเรียบร้อยแล้ว ขอบคุณที่ให้ความสนใจ',
          style: { marginTop: '20vh' }
        });
        setTimeout(() => {
          navigate('/student/applications/history');
        }, 2000);
      } else {
        messageApi.error({
          content: res?.data?.error || 'ไม่สามารถส่งใบสมัครได้ กรุณาลองใหม่อีกครั้ง',
          style: { marginTop: '20vh' }
        });
      }
    } catch (error: any) {
      // ✅ รองรับข้อความจาก backend กรณีส่งซ้ำ
      const backendMsg =
        error?.response?.data?.error ||
        error?.data?.error ||
        error?.message;

      if (
        backendMsg?.toString().toLowerCase().includes('already applied') ||
        backendMsg?.toString().includes('ส่งใบสมัครสำหรับตำแหน่งนี้ไปแล้ว')
      ) {
        setAlreadyApplied(true);
        messageApi.warning({
          content: 'คุณได้สมัครตำแหน่งนี้ไว้แล้ว ระบบไม่อนุญาตให้ส่งซ้ำ',
          style: { marginTop: '20vh' }
        });
      } else {
        messageApi.error({
          content: backendMsg || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
          style: { marginTop: '20vh' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInfoSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Card style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>{icon}</span>
        <Title level={4} style={styles.sectionTitle}>{title}</Title>
      </div>
      {children}
    </Card>
  );

  const renderReadOnlyInput = (label: string, value: string | undefined | null) => (
    <div style={styles.inputGroup}>
      <Text strong style={styles.inputLabel}>{label}</Text>
      <div style={styles.readOnlyInput}>
        <Text style={styles.inputValue}>{value || '-'}</Text>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return post && (
          <Card style={styles.jobInfoCard}>
            <div style={styles.jobHeader}>
              <TeamOutlined style={styles.jobIcon} />
              <div>
                <Title level={3} style={styles.jobTitle}>{post.post_name}</Title>
                <Text style={styles.companyName}>{post.Company?.company_name}</Text>
              </div>
            </div>

            {/* ✅ แจ้งเตือนถ้าส่งไปแล้ว */}
            {alreadyApplied && (
              <Alert
                message="คุณได้สมัครตำแหน่งนี้ไว้แล้ว กรุณารอติดตามผลการพิจารณา"
                type="warning"
                showIcon
                style={{ ...styles.alertBox, marginBottom: 16 }}
              />
            )}

            <Alert
              message="ตรวจสอบข้อมูลตำแหน่งงานให้ถูกต้องก่อนส่งใบสมัคร"
              type="info"
              showIcon
              style={styles.alertBox}
            />

            <div style={styles.stepButtonContainer}>
              <Button
                key="cancel"
                onClick={() => navigate('/student/dashboard')}
                className="step-cancel-button"
                size="large"
              >
                ยกเลิก
              </Button>
              <Button
                key="next"
                type="primary"
                onClick={() => setCurrentStep(1)}
                className="step-primary-button"
                size="large"
              >
                ถัดไป
              </Button>
            </div>
          </Card>
        );

      case 1:
        return student && (
          <div style={styles.sectionsContainer}>
            {renderInfoSection("ข้อมูลส่วนตัว", <UserOutlined />, (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('ชื่อ', student.first_name)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('นามสกุล', student.last_name)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('อายุ', String(student.age))}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('วันเกิด', student.birthday)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('เพศ', student.Gender?.name || '')}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('เบอร์โทร', student.phone_number)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('น้ำหนัก', String(student.weight))}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('ส่วนสูง', String(student.height))}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('สัญชาติ', student.nationality)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('ศาสนา', student.religion)}</Col>
              </Row>
            ))}

            {renderInfoSection("ข้อมูลที่อยู่", <HomeOutlined />, (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('บ้านเลขที่', student.Address?.house_number)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('หมู่บ้าน/หมู่', student.Address?.village)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('ถนน', student.Address?.street)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('แขวง/ตำบล', student.Address?.SubDistrict?.name_th)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('เขต/อำเภอ', student.Address?.District?.name_th)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('จังหวัด', student.Address?.Province?.name_th)}</Col>
                <Col xs={24} sm={12} md={8}>{renderReadOnlyInput('รหัสไปรษณีย์', student.Address?.Postcode?.post_code)}</Col>
              </Row>
            ))}

            {renderInfoSection("ข้อมูลการศึกษา", <BookOutlined />, (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>{renderReadOnlyInput('มหาวิทยาลัย', student.Education?.[0]?.University?.name_th)}</Col>
                <Col xs={24} sm={12}>{renderReadOnlyInput('คณะ', student.Education?.[0]?.Faculty?.name_th)}</Col>
                <Col xs={24} sm={12}>{renderReadOnlyInput('สาขา', student.Education?.[0]?.Program?.name_th)}</Col>
                <Col xs={24} sm={6}>{renderReadOnlyInput('ชั้นปี', String(student.Education?.[0]?.year))}</Col>
                <Col xs={24} sm={6}>{renderReadOnlyInput('เกรดเฉลี่ยสะสม', String(student.Education?.[0]?.grade))}</Col>
                <Col xs={24} sm={12}>{renderReadOnlyInput('ระดับการศึกษา', student.Education?.[0]?.EducationLevel?.name || '')}</Col>
              </Row>
            ))}

            {renderInfoSection("ทักษะและความสนใจ", <BulbOutlined />, (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div style={styles.tagSection}>
                    <Text strong style={styles.tagLabel}>ทักษะ</Text>
                    <div style={styles.tagContainer}>
                      {student?.StudentSkill?.map((s) => (
                        <Tag key={s.ID} style={styles.skillTag}>
                          <BuildOutlined style={{ marginRight: 4 }} />
                          {s.Skill?.skill_name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div style={styles.tagSection}>
                    <Text strong style={styles.tagLabel}>ตำแหน่งที่สนใจ</Text>
                    <div style={styles.tagContainer}>
                      {student?.StudentInterest?.map((i) => (
                        <Tag key={i.ID} style={styles.interestTag}>
                          <BulbOutlined style={{ marginRight: 4 }} />
                          {i.Interest?.interest_name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Col>
              </Row>
            ))}

            <div style={styles.stepButtonContainer}>
              <Button
                key="back"
                onClick={() => setCurrentStep(0)}
                className="step-cancel-button:"
                size="large"
              >
                ย้อนกลับ
              </Button>
              <Button
                key="edit"
                onClick={() => navigate('/student/profile')}
                className="step-edit-button "
                size="large"
              >
                แก้ไขข้อมูล
              </Button>
              <Button
                key="next"
                type="primary"
                onClick={() => setCurrentStep(2)}
                className="step-primary-button"
                size="large"
              >
                ถัดไป
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <Card style={styles.uploadCard}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>
                <FileTextOutlined />
              </span>
              <Title level={4} style={styles.sectionTitle}>
                อัปโหลดเอกสาร
              </Title>
            </div>

            {/* ✅ แจ้งเตือนถ้าเคยส่งแล้ว */}
            {alreadyApplied && (
              <Alert
                message="คุณได้สมัครตำแหน่งนี้ไว้แล้ว ระบบไม่อนุญาตให้ส่งซ้ำ"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form form={form} layout="vertical">
              <Form.Item
                label={<Text strong style={styles.formLabel}>หมายเหตุถึงบริษัท (ถ้ามี)</Text>}
                name="company_note"
              >
                <Input.TextArea
                  rows={4}
                  placeholder="เช่น ความสนใจในตำแหน่งนี้, ประสบการณ์ที่เกี่ยวข้อง..."
                  style={styles.textArea}
                />
              </Form.Item>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text strong style={styles.formLabel}>อัปโหลดเรซูเม่ (PDF)</Text>}
                    required
                  >
                    <Upload
                      beforeUpload={(file) => {
                        setResumeFile(file);
                        return false;
                      }}
                      showUploadList={{ showRemoveIcon: true }}
                      style={styles.uploadArea}
                      disabled={alreadyApplied}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        style={styles.uploadButton}
                        size="large"
                        disabled={alreadyApplied}
                      >
                        เลือกไฟล์เรซูเม่
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text strong style={styles.formLabel}>อัปโหลดทรานสคริปต์ (PDF)</Text>}
                    required
                  >
                    <Upload
                      beforeUpload={(file) => {
                        setTranscriptFile(file);
                        return false;
                      }}
                      showUploadList={{ showRemoveIcon: true }}
                      style={styles.uploadArea}
                      disabled={alreadyApplied}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        style={styles.uploadButton}
                        size="large"
                        disabled={alreadyApplied}
                      >
                        เลือกไฟล์ทรานสคริปต์
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <div style={styles.stepButtonContainer}>
                <Button
                  key="back"
                  onClick={() => setCurrentStep(1)}
                  className="step-cancel-button"
                  size="large"
                >
                  ย้อนกลับ
                </Button>
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  size="large"
                  icon={<SendOutlined style={{ animation: loading ? 'none' : 'pulse 2s infinite' }} />}
                  className="step-primary-button"
                  disabled={!resumeFile || !transcriptFile || alreadyApplied}
                >
                  {alreadyApplied ? 'ส่งใบสมัครแล้ว' : 'ส่งใบสมัคร'}
                </Button>
              </div>
            </Form>
          </Card>
        );

      case 3:
        return (
          <Card style={styles.stepsCard}>
            <Result
              status="success"
              title="ส่งใบสมัครเรียบร้อยแล้ว"
              subTitle="ระบบจะติดต่อเมื่อได้รับการคัดเลือกเข้าสัมภาษณ์"
              extra={[
                <Button
                  key="history"
                  type="primary"
                  onClick={() => navigate('/student/applications/history')}
                >
                  กลับหน้าประวัติการสมัคร
                </Button>
              ]}
            />
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {contextHolder}

      {/* Header */}
      <div style={styles.headerContainer}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={styles.backButton}
          size="large"
        >
          ย้อนกลับ
        </Button>

        <div style={styles.headerContent}>
          <Title level={2} style={styles.mainTitle}>สมัครฝึกงาน</Title>
          <Text style={styles.subtitle}>กรุณากรอกข้อมูลและอัปโหลดเอกสารเพื่อสมัครฝึกงาน</Text>
        </div>
      </div>

      {/* Progress Steps */}
      <Card style={styles.stepsCard}>
        <Steps current={currentStep} style={styles.steps}>
          <Step
            title="ข้อมูลตำแหน่ง"
            icon={<TeamOutlined />}
            description="ตรวจสอบข้อมูลตำแหน่งงาน"
          />
          <Step
            title="ข้อมูลส่วนตัว"
            icon={<UserOutlined />}
            description="ตรวจสอบข้อมูลประวัติ"
          />
          <Step
            title="อัปโหลดเอกสาร"
            icon={<FileTextOutlined />}
            description="อัปโหลดเรซูเม่และทรานสคริปต์"
          />
          <Step
            title="เสร็จสิ้น"
            icon={<CheckCircleOutlined />}
            description="ส่งใบสมัครเรียบร้อย"
          />
        </Steps>
      </Card>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
};

const styles = {
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  },
  '@keyframes fadeInUp': {
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  },
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(135, 206, 235, 0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(135, 206, 235, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(135, 206, 235, 0)' }
  },
  container: {
    backgroundColor: '#f0f7ff',
    minHeight: '100vh',
    padding: '20px',
    animation: 'fadeIn 0.8s ease-out',
  },

  headerContainer: {
    maxWidth: 1200,
    margin: '0 auto 24px auto',
  },

  backButton: {
    color: '#87ceeb',
    fontSize: '16px',
    fontWeight: 500,
    padding: '8px 16px',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: 16,
    transition: 'all 0.3s ease',
  },

  headerContent: {
    textAlign: 'center' as const,
    marginBottom: 16,
  },

  mainTitle: {
    color: '#2c5282',
    fontSize: '32px',
    fontWeight: 600,
    margin: '0 0 8px 0',
  },

  subtitle: {
    color: '#4a5568',
    fontSize: '16px',
  },

  stepsCard: {
    maxWidth: 1200,
    margin: '0 auto 24px auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
  },

  steps: {
    padding: '16px 0',
  },

  jobInfoCard: {
    maxWidth: 1200,
    margin: '0 auto 24px auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
  },

  jobHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },

  jobIcon: {
    fontSize: '24px',
    color: '#87ceeb',
    marginRight: 16,
    padding: '12px',
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
  },

  jobTitle: {
    color: '#2c5282',
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 600,
  },

  companyName: {
    color: '#4a5568',
    fontSize: '16px',
  },

  alertBox: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #b8e6ff',
    borderRadius: '8px',
  },

  sectionsContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },

  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #f0f7ff',
  },

  sectionIcon: {
    color: '#87ceeb',
    fontSize: '20px',
    marginRight: 12,
    padding: '8px',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
  },

  sectionTitle: {
    margin: 0,
    color: '#2c5282',
    fontSize: '18px',
    fontWeight: 600,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    color: '#2c5282',
    fontSize: '14px',
    display: 'block',
    marginBottom: 8,
  },

  readOnlyInput: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #b8e6ff',
    borderRadius: '8px',
    padding: '8px 12px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
  },

  inputValue: {
    color: '#4a5568',
    fontSize: '14px',
  },

  tagSection: {
    marginBottom: 16,
  },

  tagLabel: {
    color: '#2c5282',
    fontSize: '14px',
    display: 'block',
    marginBottom: 12,
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },

  skillTag: {
    backgroundColor: '#b8e6ff',
    color: '#2c5282',
    border: '1px solid #87ceeb',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },

  interestTag: {
    backgroundColor: '#f0f7ff',
    color: '#2c5282',
    border: '1px solid #b8e6ff',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },

  uploadCard: {
    maxWidth: 1200,
    margin: '24px auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #b8e6ff',
    boxShadow: '0 4px 20px rgba(135, 206, 235, 0.15)',
  },

  formLabel: {
    color: '#2c5282',
    fontSize: '15px',
  },

  textArea: {
    borderColor: '#b8e6ff',
    borderRadius: '8px',
    fontSize: '14px',
  },

  uploadArea: {
    width: '100%',
  },

  uploadButton: {
    backgroundColor: '#f0f7ff',
    borderColor: '#87ceeb',
    color: '#2c5282',
    borderRadius: '8px',
    fontWeight: 500,
    width: '100%',
    height: '48px',
    transition: 'all 0.3s ease',
  },

  actionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTop: '2px solid #f0f7ff',
  },

  stepButtonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
    marginTop: 32,
    paddingTop: 24,
    borderTop: '2px solid #f0f7ff',
  },

  cancelButton: {
    borderColor: '#87ceeb',
    color: '#87ceeb',
    borderRadius: '8px',
    height: '48px',
    padding: '0 24px',
    fontWeight: 500,
    fontSize: '16px',
    transition: 'all 0.3s ease',
  },

  submitButton: {
    backgroundColor: '#87ceeb',
    borderColor: '#87ceeb',
    borderRadius: '8px',
    height: '48px',
    padding: '0 32px',
    fontWeight: 600,
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(135, 206, 235, 0.3)',
    transition: 'all 0.3s ease',
  },
};

export default AddApplication;
