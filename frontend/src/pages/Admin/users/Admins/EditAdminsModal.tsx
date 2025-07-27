import {
  Modal,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Avatar,
  Card,
  Form,
  Spin
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  LockOutlined,
  SaveOutlined,
  EditOutlined,
  CrownOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { AdminInterface } from '../../../../interfaces/Admin';

const { Title, Text } = Typography;
const { Password } = Input;

interface AdminEditModalProps {
  visible: boolean;
  onCancel: () => void;
  adminData: AdminInterface | null;
  onSave: (data: any) => Promise<void>;
}

const EditAdminsModal: React.FC<AdminEditModalProps> = ({
  visible,
  onCancel,
  adminData,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (visible && adminData) {
      form.setFieldsValue({
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        birthday: adminData.birthday ? dayjs(adminData.birthday) : null,
        email: adminData.User?.Email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [visible, adminData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.password && values.password !== values.confirmPassword) {
        return form.setFields([
          {
            name: 'confirmPassword',
            errors: ['รหัสผ่านไม่ตรงกัน']
          }
        ]);
      }

      const updateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        birthday: values.birthday.format('YYYY-MM-DD'),
        user: {
          email: values.email,
          ...(values.password && { password: values.password })
        }
      };

      setLoading(true);
      await onSave(updateData);
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    if (value.length < 6)
      return Promise.reject(new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'));
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (value && value !== form.getFieldValue('password')) {
      return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size={40} icon={<CrownOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#262626' }}>
              แก้ไขข้อมูลผู้ดูแลระบบ
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: #{adminData?.ID}
            </Text>
          </div>
        </div>
      }
      width="80vw"
      footer={[
        <Button key="cancel" icon={<CloseOutlined />} onClick={onCancel} size="large">
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={loading}
          size="large"
        >
          บันทึกการแก้ไข
        </Button>
      ]}
      styles={{ body: { padding: '24px' } }}
      destroyOnClose
      maskClosable={false}
    >
      <Spin spinning={loading} tip="กำลังบันทึกข้อมูล...">
        <Form form={form} layout="vertical">
          <Card title="ข้อมูลส่วนตัว" style={{ marginBottom: 20 }} bodyStyle={{ padding: 20 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="first_name"
                  label="ชื่อ"
                  rules={[{ required: true }, { min: 2 }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="last_name"
                  label="นามสกุล"
                  rules={[{ required: true }, { min: 2 }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="birthday"
              label="วันเกิด"
              rules={[{ required: true, message: 'กรุณาเลือกวันเกิด' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Card>

          <Card title="ข้อมูลบัญชี" bodyStyle={{ padding: 20 }}>
            <Form.Item
              name="email"
              label="อีเมล"
              rules={[{ required: true }, { type: 'email' }]}
            >
              <Input prefix={<MailOutlined />} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="รหัสผ่านใหม่"
                  rules={[{ validator: validatePassword }]}
                >
                  <Password
                    prefix={<LockOutlined />}
                    visibilityToggle={{
                      visible: passwordVisible,
                      onVisibleChange: setPasswordVisible
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="ยืนยันรหัสผ่าน"
                  dependencies={['password']}
                  rules={[{ validator: validateConfirmPassword }]}
                >
                  <Password
                    prefix={<LockOutlined />}
                    visibilityToggle={{
                      visible: passwordVisible,
                      onVisibleChange: setPasswordVisible
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditAdminsModal;