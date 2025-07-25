import { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Image,
  Descriptions,
  List,
  Spin,
  Flex,
} from "antd";

const { Title } = Typography;

const mockCompany = {
  company_name: "ไฮเทค โซลูชั่นส์ จำกัด",
  logo: "https://swr.co.th/wp-content/uploads/2019/02/swr.png",
  dbd: "https://swr.co.th/wp-content/uploads/2019/02/Screen-Shot-2562-02-09-at-15.11.16.png",
  verify: true,
  user: {
    email: "ceo@hitech.co.th",
  },
  admin: {
    name: "ณัฐวุฒิ พนักงานดีเด่น",
  },
  address: {
    detail: "99/1 อาคาร ABC ชั้น 10",
    province: "กรุงเทพมหานคร",
  },
  contact: [
    { type: "โทรศัพท์", value: "02-123-4567" },
    { type: "อีเมล", value: "info@hitech.co.th" },
  ],
  intership_posts: [
    {
      title: "นักศึกษาฝึกงาน Web Developer",
      description: "รับนักศึกษาสาขา IT, CS, SE มีความรู้ React/Node.js",
    },
  ],
  interview_appointments: [
    {
      date: "2025-07-01",
      time: "10:00",
      student: { name: "อนุชา ใจดี" },
    },
  ],
  reviews: [
    {
      comment: "บริษัทดีมาก ให้ประสบการณ์ตรง",
      reviewer: { name: "สมชาย นักศึกษา" },
    },
  ],
};

const SubCompany = () => {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    // MOCK DATA
    setTimeout(() => {
      setCompany(mockCompany);
    }, 800); // simulate loading
  }, []);

  if (!company) return <Spin fullscreen />;

  return (
    <Layout style={{ padding: "2rem" }}>
      <Card>
        <Row gutter={[24, 24]}>
          <Col span={6}>
            <Flex vertical gap={20}>
              <Image
                src={company.logo}
                alt="โลโก้บริษัท"
                width={100}
                style={{ borderRadius: "8px" }}
              />
              <Image
                src={company.dbd}
                alt="โลโก้บริษัท"
                width={200}
                style={{ borderRadius: "8px" }}
              />
            </Flex>
          </Col>
          <Col span={18}>
            <Title level={2}>{company.company_name}</Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="DBD">{company.dbd}</Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                {company.verify ? "✅ ยืนยันแล้ว" : "❌ ยังไม่ยืนยัน"}
              </Descriptions.Item>
              <Descriptions.Item label="ผู้ดูแลระบบ (Admin)">
                {company.admin?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="เจ้าของ User">
                {company.user?.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="ที่อยู่">
                {company.address?.detail}, {company.address?.province}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">📞 ช่องทางติดต่อ</Divider>
      <List
        bordered
        dataSource={company.contact}
        renderItem={(item: any) => (
          <List.Item>
            {item.type}: {item.value}
          </List.Item>
        )}
      />

      <Divider orientation="left">📌 โพสต์ฝึกงาน</Divider>
      <List
        bordered
        dataSource={company.intership_posts}
        renderItem={(post: any) => (
          <List.Item>
            <strong>{post.title}</strong> — {post.description}
          </List.Item>
        )}
      />

      <Divider orientation="left">🗓 นัดสัมภาษณ์</Divider>
      <List
        bordered
        dataSource={company.interview_appointments}
        renderItem={(i: any) => (
          <List.Item>
            วันที่ {i.date} — เวลา {i.time} — นักศึกษา: {i.student?.name}
          </List.Item>
        )}
      />

      <Divider orientation="left">⭐ รีวิว</Divider>
      <List
        bordered
        dataSource={company.reviews}
        renderItem={(r: any) => (
          <List.Item>
            <p>
              <strong>{r.reviewer?.name}</strong>: {r.comment}
            </p>
          </List.Item>
        )}
      />
    </Layout>
  );
};

export default SubCompany;