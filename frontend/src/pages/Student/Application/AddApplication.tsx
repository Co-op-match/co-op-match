import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Upload, Typography, message, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { GetPostById, SubmitApplication } from '../../../services/https/Application';
import type { InternshipPostInterface } from '../../../interface/IIntershipPost';

const { Title } = Typography;

const AddApplication: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [post, setPost] = useState<InternshipPostInterface | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        const res = await GetPostById(Number(postId));
        setPost(res);
      } catch (error) {
        console.error(error);
        message.error('ไม่สามารถโหลดข้อมูลโพสต์ได้');
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!resumeFile || !transcriptFile) {
        messageApi.warning({ content: 'กรุณาอัปโหลดเรซูเม่และทรานสคริปต์', style: { marginTop: '20vh' } });
        return;
      }
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('transcript', transcriptFile);
      formData.append('company_note', values.company_note || '');
      formData.append('internship_post_id', postId!);
      formData.append('student_id', localStorage.getItem('id')!);

      const res = await SubmitApplication(formData);
      if (res.status === 200 || res.status === 201) {
        messageApi.success({ content: 'ส่งใบสมัครเรียบร้อยแล้ว', style: { marginTop: '20vh' } });
        navigate('/student/dashboard');
      } else {
        messageApi.error({ content: 'ส่งใบสมัครไม่สำเร็จ', style: { marginTop: '20vh' } });
      }
    } catch (error) {
      console.error(error);
      messageApi.error({ content: 'เกิดข้อผิดพลาด', style: { marginTop: '20vh' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      {contextHolder}
      <Card style={{ maxWidth: 700, margin: 'auto' }}>
        <Title level={3}>ส่งใบสมัคร</Title>
        {post && (
          <div style={{ marginBottom: 24 }}>
            <p><strong>ตำแหน่ง:</strong> {post.title}</p>
            <p><strong>บริษัท:</strong> {post.Company?.company_name}</p>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item label="หมายเหตุถึงบริษัท (ถ้ามี)" name="company_note">
            <Input.TextArea rows={3} placeholder="เขียนเพิ่มเติมถึงบริษัท เช่น ความสนใจในงานนี้..." />
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
            <Button type="primary" onClick={handleSubmit} loading={loading} block>
              ส่งใบสมัคร
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddApplication;
