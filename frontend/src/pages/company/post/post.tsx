import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Form, Select, InputNumber, Row, Col } from 'antd';
import axios from 'axios';
import { GetWorkModes, GetWorkDays, GetStipends, GetJobTypes, GetStatusPosts, GetBenefits } from '../../../services/https/post/index'; // เพิ่มการ import ฟังก์ชันที่ดึงข้อมูลจาก API
import { useNavigate } from 'react-router-dom';


// Define the interface for Job Post data
interface JobPost {
  id: number;
  post_name: string;
  company_name: string;
  post_description: string;
  qualifications: string;
  company_id: number;
  quantity: number;
  location: string;
  district: string;
  province: string;
}

// List of all 77 provinces in Thailand (alphabetical order)
const provinces = [
  'กระบี่', 'กรุงเทพมหานคร', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา',
  'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม',
  'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'ปทุมธานี',
  'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พะเยา', 'พังงา', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี',
  'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ระยอง', 'ราชบุรี',
  'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม',
  'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'สตูล', 'หนองคาย',
  'หนองบัวลำภู', 'อำนาจเจริญ', 'อุดรธานี', 'อุทัยธานี', 'อุบลราชธานี', 'อ่างทอง', 'ยะลา', 'ร้อยเอ็ด',
  'ลำพูน', 'ประจวบคีรีขันธ์', 'ราชบุรี', 'สมุทรปราการ', 'สงขลา', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'ปราจีนบุรี',
];

const JobPostings = () => {
  const [visible, setVisible] = useState(false); // Control modal visibility for post details
  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Control modal visibility for adding new post
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null); // Store selected post details
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]); // Store job posts fetched from API
  const [workModes, setWorkModes] = useState([]); // Store work modes
  const [workDays, setWorkDays] = useState([]); // Store work days
  const [stipends, setStipends] = useState([]); // Store stipends
  const [jobTypes, setJobTypes] = useState([]); // Store job types
  const [statusPosts, setStatusPosts] = useState([]); // Store status posts
  const [benefits, setBenefits] = useState([]);
  const navigate = useNavigate();



  const [form] = Form.useForm(); // Form instance for adding a new post

  // Fetch data for job posts and other necessary data when component mounts
  useEffect(() => {
    const fetchJobPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/getpost'); // ✅ แก้ตรงนี้
        console.log('Fetched job posts:', response.data);

        if (Array.isArray(response.data)) {
          setJobPosts(response.data);
        } else {
          message.error('รูปแบบข้อมูล job post ไม่ถูกต้อง');
        }
      } catch (error) {
        message.error('ไม่สามารถดึงข้อมูลโพสต์งานจากเซิร์ฟเวอร์ได้');
      }
    };



    const fetchWorkModes = async () => {
      const response = await GetWorkModes();
      console.log(response)
      setWorkModes(response);
    };

    const fetchWorkDays = async () => {
      const response = await GetWorkDays();
      setWorkDays(response);
    };

    const fetchStipends = async () => {
      const response = await GetStipends();
      setStipends(response);
    };

    const fetchJobTypes = async () => {
      const response = await GetJobTypes();
      setJobTypes(response);
    };

    const fetchStatusPosts = async () => {
      const response = await GetStatusPosts();
      setStatusPosts(response);
    };

    const fetchBenefit = async () => {
      const response = await GetBenefits();
      setBenefits(response);
    };

    fetchJobPosts();
    fetchWorkModes();
    fetchWorkDays();
    fetchStipends();
    fetchJobTypes();
    fetchStatusPosts();
    fetchBenefit();
  }, []);

  // Handle adding a new post
  const handleAddPost = async (values: any) => {
    values.StatusPostID = 1; // 🟢 บังคับค่าแบบไม่ให้ผู้ใช้เลือก

    console.log("👉 ค่าที่จะส่ง:", values);

    try {
      const response = await axios.post('http://localhost:8000/post', values);
      if (response.status >= 200 && response.status < 300) {
        message.success('โพสต์งานใหม่ถูกบันทึกสำเร็จ!');
        form.resetFields();
        setIsAddModalVisible(false);

        // ✅ รีโหลดหน้า
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        message.error('เกิดข้อผิดพลาดในการบันทึกโพสต์งาน');
      }
    } catch (error) {
      message.error('ไม่สามารถบันทึกโพสต์งานได้');
    }
  };

  // Columns for the table
  const columns = [
    {
      title: 'ชื่อโพสต์',
      dataIndex: 'post_name',
      key: 'post_name',
      render: (text: string, record: JobPost) => (
        <Button
          type="link"
          style={{ color: '#3399FF' }}
          onClick={() => navigate(`/post/${record.id}`)} // ✅ แก้ตรงนี้
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'บริษัท',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'จำนวนที่รับ',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];


  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>โพสต์รับสมัครฝึกงาน</h2>

      <Row justify="end" style={{ marginBottom: '20px' }}>
        {/* Button to open add job post modal */}
        <Button type="primary" onClick={() => setIsAddModalVisible(true)} style={buttonStyle}>
          เพิ่มโพสต์
        </Button>
      </Row>

      <Table
        dataSource={jobPosts}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={tableStyle}
      />

      {/* Modal for showing job post details */}
      <JobPostModal
        open={visible}
        onCancel={() => setVisible(false)}
        post={selectedPost}
      />

      {/* Modal for adding a new job post */}
      <Modal
        title="เพิ่มโพสต์"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        style={{ borderRadius: '12px', width: '600px' }}
      >
        <Form
          form={form}
          onFinish={handleAddPost}
          layout="vertical"
        >
          <Form.Item
            label="หัวข้อหรือตำแหน่งที่เปิดรับ"
            name="post_name"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้อหรือตำแหน่งที่เปิดรับ' }]}
          >
            <Input placeholder="กรอกหัวข้อหรือตำแหน่งที่เปิดรับ" />
          </Form.Item>

          <Form.Item
            label="จำนวนที่รับ"
            name="quantity"
            rules={[{ required: true, message: 'กรุณากรอกจำนวนที่รับ' }]}
          >
            <InputNumber placeholder="กรอกจำนวนที่รับ" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="รายละเอียดงาน"
            name="post_description"
            rules={[{ required: true, message: 'กรุณากรอกรายละเอียดงาน' }]}
          >
            <Input.TextArea rows={4} placeholder="กรอกรายละเอียดงาน" />
          </Form.Item>

          <Form.Item
            label="คุณสมบัติ"
            name="qualifications"
            rules={[{ required: true, message: 'กรุณากรอกคุณสมบัติ' }]}
          >
            <Input.TextArea rows={4} placeholder="กรอกคุณสมบัติเป็นข้อๆ" />
          </Form.Item>

          <Form.Item
            label="เกรดเฉลี่ยขั้นต่ำ (GPA)"
            name="min_gpa"
            rules={[{ required: true, message: 'กรุณากรอกเกรดเฉลี่ยขั้นต่ำ' }]}
          >
            <InputNumber step={0.01} min={0} max={4} style={{ width: '100%' }} placeholder="ตัวอย่าง: 2.50" />
          </Form.Item>

          <Form.Item
            label="ประเภทงาน"
            name="JobTypeID"
            rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}
          >
            <Select placeholder="เลือกประเภทงาน">
              {jobTypes.map((jt: any) => (
                <Select.Option key={jt.ID} value={jt.ID}>
                  {jt.job_type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item
            label="ค่าตอบแทน"
            name="StipendID"
            rules={[{ required: true, message: 'กรุณาเลือกค่าตอบแทน' }]}
          >
            <Select placeholder="เลือกค่าตอบแทน">
              {stipends.map((s: any) => (
                <Select.Option key={s.ID} value={s.ID}>
                  {s.stipend}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item
            label="วันทำงาน"
            name="WorkDayID"
            rules={[{ required: true, message: 'กรุณาเลือกวันทำงาน' }]}
          >
            <Select placeholder="เลือกวันทำงาน">
              {workDays.map((wd: any) => (
                <Select.Option key={wd.ID} value={wd.ID}>
                  {wd.work_day}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="รูปแบบการทำงาน"
            name="WorkModeID"
            rules={[{ required: true, message: 'กรุณาเลือกรูปแบบการทำงาน' }]}
          >
            <Select placeholder="เลือกรูปแบบการทำงาน">
              {workModes.map((wm: any) => (
                <Select.Option key={wm.ID} value={wm.ID}>
                  {wm.work_mode}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item
            label="สวัสดิการ"
            name="benefit_id"
            rules={[{ required: true, message: 'กรุณาเลือกสวัสดิการ' }]}
          >
            <Select placeholder="เลือกสวัสดิการ">
              {benefits.map((b: any) => (
                <Select.Option key={b.ID} value={b.ID}>
                  {b.benefit_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>



          <h3 style={{ fontWeight: 'bold', marginTop: '20px' }}>ที่ตั้ง</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="รายละเอียด"
                name="location"
                rules={[{ required: true, message: 'กรุณากรอกรายละเอียดที่ตั้ง' }]}
              >
                <Input placeholder="กรอกรายละเอียดที่ตั้ง" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="district" label="แขวง/ตำบล">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" label="เขต/อำเภอ">
                <Input />
              </Form.Item>
            </Col>


            <Col span={12}>
              <Form.Item
                label="จังหวัด"
                name="location_province"
                rules={[{ required: true, message: 'กรุณากรอกจังหวัด' }]}
              >
                <Select
                  showSearch
                  placeholder="กรอกจังหวัด"
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    if (option && typeof option.children === 'string') {
                      const children = option.children as string;
                      return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                    }
                    return false;
                  }}
                  allowClear
                >
                  {provinces.map((province, index) => (
                    <Select.Option key={index} value={province}>
                      {province}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Row gutter={10} justify="end">
              <Col span={8}>
                <Button
                  type="default"
                  onClick={() => setIsAddModalVisible(false)}
                  style={{ width: '50%' }}
                >
                  ยกเลิก
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '50%' }}
                >
                  โพสต์
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Modal for showing post details
const JobPostModal = ({ visible, onCancel, post }: any) => {
  if (!post) return null;

  return (
    <Modal
      title="รายละเอียดโพสต์งาน"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel} style={buttonStyle}>
          ปิด
        </Button>,
      ]}
    >
      <p><strong>หัวข้อหรือตำแหน่งที่เปิดรับ:</strong> {post.post_name}</p>
      <p><strong>จำนวนที่รับ:</strong> {post.quantity}</p>
      <p><strong>รายละเอียด:</strong> {post.post_description}</p>
      <p><strong>คุณสมบัติ:</strong> {post.qualifications}</p>
      <p><strong>รายละเอียดที่ตั้ง:</strong> {post.location}</p>
      <p><strong>แขวง/ตำบล:</strong> {post.district}</p>
      <p><strong>เขต/อำเภอ:</strong> {post.province}</p>
      <p><strong>จังหวัด:</strong> {post.location_province}</p>
    </Modal>
  );
};

const containerStyle = {
  backgroundColor: '#f0f8ff',
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

const tableStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const buttonStyle = {
  backgroundColor: '#0066cc',
  color: 'white',
  borderRadius: '6px',
  padding: '10px 20px',
  fontWeight: 'bold',
};

export default JobPostings;
