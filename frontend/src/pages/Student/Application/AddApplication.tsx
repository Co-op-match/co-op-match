import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Divider,
    Space,
    Tag,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { GetPostById, CreateApplication } from '../../../services/https/Application';
import { GetStudentByUserId } from '../../../services/https/index'; // ✅ แก้ตรงนี้
import type { InternshipPostInterface } from '../../../interface/IIntershipPost';
import type { StudentInterface } from '../../../interfaces/Student';

const { Title } = Typography;

const AddApplication: React.FC = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [post, setPost] = useState<InternshipPostInterface | null>(null);
    const [student, setStudent] = useState<StudentInterface | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const userId = localStorage.getItem('id');
        if (!userId) return;

        const fetchData = async () => {
            try {
                const [postRes, studentRes] = await Promise.all([
                    GetPostById(Number(postId)),
                    GetStudentByUserId(Number(userId)),
                ]);
                setPost(postRes);
                setStudent(studentRes);

                // ✅ Console log education
                console.log("✅ student.Education:", studentRes.Education);
                console.log("✅ student.Education[0]:", studentRes.Education?.[0]);
            } catch (error) {
                message.error('โหลดข้อมูลล้มเหลว');
            }
        };

        if (postId) fetchData();
    }, [postId]);


    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!resumeFile || !transcriptFile) {
                messageApi.warning({ content: 'กรุณาอัปโหลดเรซูเม่และทรานสคริปต์', style: { marginTop: '20vh' } });
                return;
            }

            const formData = new FormData();
            formData.append('resume', resumeFile);
            formData.append('transcript', transcriptFile);
            formData.append('status', 'Pending Interview'); // หรือค่าจริง
            formData.append('submit_at', new Date().toISOString());
            formData.append('student_id', localStorage.getItem('id')!);

            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            const res = await CreateApplication(Number(postId), formData);
            console.log(res)

            if (res.status === 200 || res.status === 201) {
                messageApi.success({ content: 'ส่งใบสมัครเรียบร้อยแล้ว', style: { marginTop: '20vh' } });
                navigate('/student/dashboard');
            } else {

                messageApi.error({ content: 'ส่งใบสมัครไม่สำเร็จ', style: { marginTop: '20vh' } });

            }
        } catch (error) {
            messageApi.error({ content: 'เกิดข้อผิดพลาด', style: { marginTop: '20vh' } });
        } finally {

            setLoading(false);
        }
    };

    const renderReadOnlyInput = (label: string, value: string | undefined | null) => (
        <Form.Item label={label}>
            <Input value={value ?? ''} readOnly />
        </Form.Item>
    );

    return (
        <div style={{ padding: 32 }}>
            {contextHolder}
            <Card style={{ maxWidth: 900, margin: 'auto' }}>
                <Title level={3}>โปรดกรอกข้อมูลเรซูเม่ของคุณ</Title>

                {post && (
                    <div style={{ marginBottom: 24 }}>
                        <p><strong>ตำแหน่ง:</strong> {post.post_name}</p>
                        <p><strong>บริษัท:</strong> {post.Company?.company_name}</p>
                    </div>
                )}

                {student && (
                    <>
                        <Divider orientation="left">ข้อมูลทั่วไป</Divider>
                        <Row gutter={16}>
                            <Col span={12}>{renderReadOnlyInput('ชื่อ', student.first_name)}</Col>
                            <Col span={12}>{renderReadOnlyInput('นามสกุล', student.last_name)}</Col>
                            <Col span={8}>{renderReadOnlyInput('อายุ', String(student.age))}</Col>
                            <Col span={8}>{renderReadOnlyInput('วันเกิด', student.birthday)}</Col>
                            <Col span={8}>{renderReadOnlyInput('เพศ', student.Gender?.name || '')}</Col>
                            <Col span={8}>{renderReadOnlyInput('น้ำหนัก', String(student.weight))}</Col>
                            <Col span={8}>{renderReadOnlyInput('ส่วนสูง', String(student.height))}</Col>
                            <Col span={8}>{renderReadOnlyInput('เบอร์โทร', student.phone_number)}</Col>
                            <Col span={8}>{renderReadOnlyInput('สัญชาติ', student.nationality)}</Col>
                            <Col span={8}>{renderReadOnlyInput('ศาสนา', student.religion)}</Col>
                        </Row>

                        <Divider orientation="left">ข้อมูลที่อยู่</Divider>
                        <Row gutter={16}>
                            <Col span={8}>{renderReadOnlyInput('บ้านเลขที่', student.Address?.house_number)}</Col>
                            <Col span={8}>{renderReadOnlyInput('หมู่บ้าน/หมู่', student.Address?.village)}</Col>
                            <Col span={8}>{renderReadOnlyInput('ถนน', student.Address?.street)}</Col>
                            <Col span={8}>{renderReadOnlyInput('แขวง/ตำบล', student.Address?.SubDistrict?.name_th)}</Col>
                            <Col span={8}>{renderReadOnlyInput('เขต/อำเภอ', student.Address?.District?.name_th)}</Col>
                            <Col span={8}>{renderReadOnlyInput('จังหวัด', student.Address?.Province?.name_th)}</Col>
                            <Col span={8}>{renderReadOnlyInput('รหัสไปรษณีย์', student.Address?.Postcode?.post_code)}</Col>
                        </Row>

                        <Divider orientation="left">ข้อมูลการศึกษา</Divider>
                        <Row gutter={16}>
                            <Col span={12}>{renderReadOnlyInput('มหาวิทยาลัย', student.Education?.[0]?.University?.name_th)}</Col>
                            <Col span={12}>{renderReadOnlyInput('คณะ', student.Education?.[0]?.Faculty?.name_th)}</Col>
                            <Col span={12}>{renderReadOnlyInput('สาขา', student.Education?.[0]?.Program?.name_th)}</Col>
                            <Col span={6}>{renderReadOnlyInput('ชั้นปี', String(student.Education?.[0]?.year))}</Col>
                            <Col span={6}>{renderReadOnlyInput('เกรดเฉลี่ยสะสม', String(student.Education?.[0]?.grade))}</Col>
                            <Col span={12}>{renderReadOnlyInput('ระดับการศึกษา', student.Education?.[0]?.EducationLevel?.name || '')}</Col>
                        </Row>


                        <Divider orientation="left">ทักษะและความสามารถ</Divider>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="ทักษะ">
                                    <Space wrap>
                                        {student?.StudentSkill?.map((s) => (
                                            <Tag key={s.ID}>{s.Skill?.skill_name}</Tag>
                                        ))}
                                    </Space>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="ตำแหน่งที่สนใจ">
                                    <Space wrap>
                                        {student?.StudentInterest?.map((i) => (
                                            <Tag key={i.ID}>{i.Interest?.interest_name}</Tag>
                                        ))}
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>

                    </>
                )}

                <Divider orientation="left">อัปโหลดไฟล์</Divider>
                <Form form={form} layout="vertical">
                    <Form.Item label="หมายเหตุถึงบริษัท (ถ้ามี)" name="company_note">
                        <Input.TextArea rows={3} placeholder="เช่น ความสนใจในตำแหน่งนี้..." />
                    </Form.Item>

                    <Form.Item label="อัปโหลดเรซูเม่ (PDF)" required>
                        <Upload beforeUpload={(file) => { setResumeFile(file); return false; }} showUploadList={{ showRemoveIcon: true }}>
                            <Button icon={<UploadOutlined />}>เลือกไฟล์เรซูเม่</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item label="อัปโหลดทรานสคริปต์ (PDF)" required>
                        <Upload beforeUpload={(file) => { setTranscriptFile(file); return false; }} showUploadList={{ showRemoveIcon: true }}>
                            <Button icon={<UploadOutlined />}>เลือกไฟล์ทรานสคริปต์</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Button danger onClick={() => navigate('/student/dashboard')}>ยกเลิก</Button>
                            <Button type="primary" onClick={handleSubmit} loading={loading}>ส่งใบสมัคร</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AddApplication;
