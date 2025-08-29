import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Tabs, 
  Card, 
  Table, 
  Avatar, 
  Tag, 
  Empty, 
  Skeleton, 
  Typography 
} from 'antd';
import { 
  TeamOutlined, 
  BankOutlined, 
  UserOutlined, 
  CalendarOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

// Mock data for students
const studentsData = [
  {
    id: 1,
    prefix_name: "นาย",
    first_name: "สมชาย",
    last_name: "ใจดี",
    student_id: "6501234567",
    program_name: "วิทยาการคอมพิวเตอร์",
    year: 4,
    gpa: 3.75,
    avatar_url: null,
    current_internship: {
      company_name: "บริษัท เทคโนโลยี จำกัด",
      position: "นักพัฒนาเว็บไซต์",
      status: "กำลังฝึก",
      province_name: "กรุงเทพมหานคร",
      start_date: "2024-06-01",
      end_date: "2024-09-30"
    }
  },
  {
    id: 2,
    prefix_name: "นางสาว",
    first_name: "สุดา",
    last_name: "มั่นใจ",
    student_id: "6501234568",
    program_name: "วิศวกรรมซอฟต์แวร์",
    year: 3,
    gpa: 3.45,
    avatar_url: null,
    current_internship: {
      company_name: "บริษัท ดิจิตอล โซลูชั่น",
      position: "นักวิเคราะห์ระบบ",
      status: "เสร็จสิ้น",
      province_name: "เชียงใหม่",
      start_date: "2024-05-15",
      end_date: "2024-08-15"
    }
  },
  {
    id: 3,
    prefix_name: "นาย",
    first_name: "วิชัย",
    last_name: "รักเรียน",
    student_id: "6501234569",
    program_name: "เทคโนโลยีสารสนเทศ",
    year: 4,
    gpa: 3.20,
    avatar_url: null,
    current_internship: {
      company_name: "สำนักงานรัฐบาล",
      position: "ผู้ช่วยระบบ IT",
      status: "รอเริ่ม",
      province_name: "นครราชสีมา",
      start_date: "2024-10-01",
      end_date: "2024-12-31"
    }
  },
  {
    id: 4,
    prefix_name: "นางสาว",
    first_name: "มาลี",
    last_name: "สร้างสรรค์",
    student_id: "6501234570",
    program_name: "วิทยาการคอมพิวเตอร์",
    year: 3,
    gpa: 3.90,
    avatar_url: null,
    current_internship: null
  }
];

// Mock data for company summary
const companySummaryData = [
  {
    company_id: 1,
    company_name: "บริษัท เทคโนโลยี จำกัด",
    logo_url: null,
    student_count: 2,
    students: studentsData.slice(0, 2)
  },
  {
    company_id: 2,
    company_name: "บริษัท ดิจิตอล โซลูชั่น",
    logo_url: null,
    student_count: 1,
    students: [studentsData[1]]
  },
  {
    company_id: 3,
    company_name: "สำนักงานรัฐบาล",
    logo_url: null,
    student_count: 1,
    students: [studentsData[2]]
  }
];

const AdvisorDashboard = () => {
  const [studentsLoading] = useState(false);

  const formatRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'short' 
    });
    const end = new Date(endDate).toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    return `${start} - ${end}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 248, 255, 1) 25%, rgba(207, 234, 250, 1) 60%, rgba(159, 218, 252, 1) 100%)',
      padding: '24px'
    }}>
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <Tabs
            defaultActiveKey="students"
            className="advisor-tabs"
            items={[
              {
                key: "students",
                label: (
                  <span className="tab-label">
                    <TeamOutlined />
                    <span>นักศึกษาที่ดูแล</span>
                  </span>
                ),
                children: (
                  <Card
                    title={
                      <div className="card-title">
                        <div className="card-title__icon card-title__icon--blue">
                          <TeamOutlined />
                        </div>
                        <div>
                          <div className="card-title__text">นักศึกษาที่ดูแล</div>
                          <div className="card-title__subtext">
                            รายชื่อและข้อมูลการฝึกงานของนักศึกษา
                          </div>
                        </div>
                      </div>
                    }
                    className="academicstaff-profile-card advisor-students-card"
                    headStyle={{ borderBottom: "0" }}
                  >
                    {studentsLoading ? (
                      <Skeleton active paragraph={{ rows: 8 }} />
                    ) : studentsData.length === 0 ? (
                      <Empty
                        description={
                          <div>
                            <div>ยังไม่มีนักศึกษาที่ดูแล</div>
                            <div className="empty-subtext">
                              นักศึกษาจะปรากฏที่นี่เมื่อได้รับการมอบหมาย
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <Table
                        dataSource={studentsData}
                        rowKey="id"
                        size="middle"
                        sticky
                        scroll={{ x: 1200 }}
                        className="table-zebra"
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => (
                            <span className="pagination-total">
                              แสดง {range[0]}-{range[1]} จาก {total} คน
                            </span>
                          ),
                        }}
                        rowClassName={(_, index) =>
                          index % 2 === 0 ? "table-row-even" : "table-row-odd"
                        }
                        columns={[
                          {
                            title: <div className="th-title">นักศึกษา</div>,
                            dataIndex: "name",
                            key: "name",
                            width: 240,
                            fixed: "left",
                            render: (_, record) => {
                              const fullName = `${record.prefix_name ?? ""}${record.first_name} ${record.last_name}`.trim();
                              return (
                                <div className="cell-student">
                                  <Avatar
                                    size={44}
                                    src={record.avatar_url || undefined}
                                    icon={!record.avatar_url ? <UserOutlined /> : undefined}
                                    className="cell-student__avatar"
                                  />
                                  <div>
                                    <div className="cell-student__name">{fullName}</div>
                                    <div className="cell-student__id">
                                      รหัสนักศึกษา: {record.student_id || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          },
                          {
                            title: <div className="th-title">หลักสูตร</div>,
                            dataIndex: "program_name",
                            key: "program_name",
                            width: 180,
                            render: (program_name) =>
                              program_name ? (
                                <Tag className="tag-chip tag-chip--blue">{program_name}</Tag>
                              ) : (
                                <span className="muted">-</span>
                              ),
                          },
                          {
                            title: <div className="th-title th-center">ชั้นปี</div>,
                            dataIndex: "year",
                            key: "year",
                            width: 100,
                            align: "center",
                            render: (year) =>
                              typeof year === "number" ? (
                                <Tag className="tag-chip tag-chip--indigo">ปี {year}</Tag>
                              ) : (
                                <span className="muted">-</span>
                              ),
                          },
                          {
                            title: <div className="th-title th-center">GPA</div>,
                            dataIndex: "gpa",
                            key: "gpa",
                            width: 100,
                            align: "center",
                            render: (gpa) =>
                              typeof gpa === "number" ? (
                                <Tag
                                  className={`tag-chip ${
                                    gpa >= 3.5
                                      ? "tag-chip--green"
                                      : gpa >= 3.0
                                      ? "tag-chip--amber"
                                      : "tag-chip--red"
                                  }`}
                                >
                                  {gpa.toFixed(2)}
                                </Tag>
                              ) : (
                                <span className="muted">-</span>
                              ),
                          },
                          {
                            title: <div className="th-title">บริษัท & ตำแหน่ง</div>,
                            dataIndex: "company",
                            key: "company",
                            width: 260,
                            render: (_, record) => {
                              const ci = record.current_internship;
                              return ci ? (
                                <div className="cell-company">
                                  <div className="cell-company__name">
                                    <BankOutlined className="cell-company__icon" />
                                    {ci.company_name}
                                  </div>
                                  {ci.position && (
                                    <Tag className="tag-chip tag-chip--cyan">{ci.position}</Tag>
                                  )}
                                </div>
                              ) : (
                                <div className="warn-text">ยังไม่มีข้อมูล</div>
                              );
                            },
                          },
                          {
                            title: <div className="th-title th-center">จังหวัด</div>,
                            dataIndex: "province",
                            key: "province",
                            width: 130,
                            align: "center",
                            render: (_, record) => {
                              const ci = record.current_internship;
                              return ci?.province_name ? (
                                <Tag className="tag-chip tag-chip--blue">{ci.province_name}</Tag>
                              ) : (
                                <span className="muted">-</span>
                              );
                            },
                          },
                          {
                            title: <div className="th-title th-center">สถานะ</div>,
                            dataIndex: "status",
                            key: "status",
                            width: 140,
                            align: "center",
                            render: (_, record) => {
                              const ci = record.current_internship;
                              if (!ci?.status) {
                                return <Tag className="tag-chip tag-chip--gray">ยังไม่ได้ฝึก</Tag>;
                              }
                              const cls =
                                ci.status === "กำลังฝึก"
                                  ? "tag-chip--green"
                                  : ci.status === "เสร็จสิ้น"
                                  ? "tag-chip--blue"
                                  : ci.status === "รอเริ่ม"
                                  ? "tag-chip--amber"
                                  : "tag-chip--gold";
                              return <Tag className={`tag-chip ${cls}`}>{ci.status}</Tag>;
                            },
                          },
                          {
                            title: <div className="th-title th-center">ระยะเวลา</div>,
                            dataIndex: "duration",
                            key: "duration",
                            width: 210,
                            align: "center",
                            render: (_, record) => {
                              const ci = record.current_internship;
                              return ci ? (
                                <Tag className="tag-range">
                                  <CalendarOutlined className="tag-range__icon" />
                                  {formatRange(ci.start_date, ci.end_date)}
                                </Tag>
                              ) : (
                                <span className="muted">-</span>
                              );
                            },
                          },
                        ]}
                      />
                    )}
                  </Card>
                ),
              },
              {
                key: "companies",
                label: (
                  <span className="tab-label">
                    <BankOutlined />
                    <span>บริษัทที่นักศึกษาไปฝึก</span>
                  </span>
                ),
                children: (
                  <Card
                    title={
                      <div className="card-title">
                        <div className="card-title__icon card-title__icon--green">
                          <BankOutlined />
                        </div>
                        <div>
                          <div className="card-title__text">บริษัทที่นักศึกษาไปฝึก</div>
                          <div className="card-title__subtext">สรุปการฝึกงานตามบริษัท</div>
                        </div>
                      </div>
                    }
                    className="academicstaff-profile-card advisor-companies-card"
                    headStyle={{ borderBottom: "0" }}
                  >
                    {studentsLoading ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : companySummaryData.length === 0 ? (
                      <Empty
                        description={
                          <div>
                            <div>ยังไม่มีข้อมูลบริษัทที่นักศึกษาไปฝึก</div>
                            <div className="empty-subtext">
                              ข้อมูลจะปรากฏเมื่อนักศึกษาเริ่มฝึกงาน
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <Table
                        dataSource={companySummaryData}
                        rowKey={(r) => `${r.company_id}-${r.company_name}`}
                        size="middle"
                        className="table-zebra"
                        pagination={{
                          pageSize: 8,
                          showSizeChanger: true,
                          showTotal: (total, range) => (
                            <span className="pagination-total">
                              แสดง {range[0]}-{range[1]} จาก {total} บริษัท
                            </span>
                          ),
                        }}
                        rowClassName={(_, index) =>
                          index % 2 === 0 ? "table-row-even" : "table-row-odd"
                        }
                        expandable={{
                          expandedRowRender: (record) => (
                            <div className="company-expand">
                              <div className="company-expand__title">
                                🎓 รายชื่อนักศึกษาทั้งหมด ({record.students.length} คน)
                              </div>
                              <div className="company-expand__grid">
                                {record.students.map((s) => (
                                  <div className="company-expand__item" key={s.id}>
                                    <Avatar
                                      size={36}
                                      src={s.avatar_url || undefined}
                                      icon={!s.avatar_url ? <UserOutlined /> : undefined}
                                      className="company-expand__avatar"
                                    />
                                    <div className="company-expand__text">
                                      <div className="company-expand__name">
                                        {(s.prefix_name ?? "") + s.first_name + " " + s.last_name}
                                      </div>
                                      {s.current_internship?.position && (
                                        <Tag className="tag-chip tag-chip--cyan">
                                          {s.current_internship.position}
                                        </Tag>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                          rowExpandable: (record) => record.students && record.students.length > 0,
                        }}
                        columns={[
                          {
                            title: <div className="th-title">บริษัท</div>,
                            dataIndex: "company_name",
                            key: "company_name",
                            width: 320,
                            render: (company_name, record) => (
                              <div className="cell-company-main">
                                <Avatar
                                  shape="square"
                                  size={56}
                                  src={record.logo_url || undefined}
                                  icon={!record.logo_url ? <BankOutlined /> : undefined}
                                  className="cell-company-main__logo"
                                />
                                <div>
                                  <div className="cell-company-main__name">{company_name}</div>
                                  <div className="cell-company-main__tagline">องค์กรพันธมิตร</div>
                                </div>
                              </div>
                            ),
                          },
                          {
                            title: <div className="th-title th-center">จำนวนนักศึกษา</div>,
                            dataIndex: "student_count",
                            key: "student_count",
                            width: 180,
                            align: "center",
                            render: (count) => (
                              <div className="cell-count">
                                <div className="cell-count__num">{count}</div>
                                <Tag className="tag-chip tag-chip--blue">คน</Tag>
                              </div>
                            ),
                          },
                          {
                            title: <div className="th-title">นักศึกษา (แสดง 3 คนแรก)</div>,
                            dataIndex: "students",
                            key: "students_preview",
                            render: (students) => (
                              <div className="students-preview">
                                {students.slice(0, 3).map((s, index) => (
                                  <div
                                    key={s.id}
                                    className={`students-preview__row ${index % 2 === 0 ? "is-alt" : ""}`}
                                  >
                                    <Avatar
                                      size={28}
                                      src={s.avatar_url || undefined}
                                      icon={!s.avatar_url ? <UserOutlined /> : undefined}
                                      className="students-preview__avatar"
                                    />
                                    <div className="students-preview__name">
                                      {(s.prefix_name ?? "") + s.first_name + " " + s.last_name}
                                    </div>
                                  </div>
                                ))}
                                {students.length > 3 && (
                                  <div className="students-preview__more">
                                    <Text type="secondary" className="muted-italic">
                                      และอีก {students.length - 3} คน
                                    </Text>
                                  </div>
                                )}
                              </div>
                            ),
                          },
                        ]}
                      />
                    )}
                  </Card>
                ),
              },
            ]}
          />
        </Col>
      </Row>

      <style jsx>{`
        :root {
          --card-bg: #ffffff;
          --border: #f0f0f0;
          --border-strong: #e8e8e8;
          --text: #262626;
          --muted: #8c8c8c;
          --primary: #1890ff;
          --primary-dark: #0d47a1;
          --green: #52c41a;
          --indigo: #3f51b5;
          --amber: #faad14;
          --red: #ff4d4f;
          --cyan: #13c2c2;
          --success-bg: #f6ffed;
          --success-border: #b7eb8f;
          --success-text: #389e0d;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
          --shadow-xs: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .advisor-tabs :global(.ant-tabs-nav) {
          margin-bottom: 16px;
        }
        .advisor-tabs :global(.ant-tabs-tab) {
          padding: 12px 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .advisor-tabs :global(.ant-tabs-tab:hover) {
          background: rgba(24, 144, 255, 0.08);
          transform: translateY(-1px);
        }
        .advisor-tabs :global(.ant-tabs-tab.ant-tabs-tab-active) {
          background: #fff;
          box-shadow: var(--shadow-sm);
          border: 1px solid rgba(24, 144, 255, 0.12);
        }
        .tab-label {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-weight: 600;
          font-size: 14px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 10px;
        }

        .card-title__icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          color: #fff;
          font-size: 18px;
        }
        .card-title__icon--blue { 
          background: linear-gradient(135deg, var(--primary), #40a9ff); 
        }
        .card-title__icon--green { 
          background: linear-gradient(135deg, var(--green), #73d13d); 
        }

        .card-title__text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .card-title__subtext {
          font-size: 14px;
          color: var(--muted);
          margin-top: 2px;
        }

        .academicstaff-profile-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          box-shadow: 
            0 4px 20px rgba(13, 71, 161, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .academicstaff-profile-card:hover {
          box-shadow: 
            0 8px 32px rgba(13, 71, 161, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .table-zebra :global(.ant-table) {
          background: var(--card-bg);
          border-radius: 8px;
          overflow: hidden;
        }

        .table-zebra :global(.ant-table-thead > tr > th) {
          background: linear-gradient(135deg, #fafbfc, #f0f2f5) !important;
          border-bottom: 2px solid var(--border-strong) !important;
          font-weight: 700;
          color: var(--text);
          padding: 16px 12px;
        }

        .table-zebra :global(.ant-table-tbody > tr > td) {
          border-bottom: 1px solid var(--border);
          padding: 16px 12px;
        }

        .table-row-even { 
          background-color: rgba(250, 250, 250, 0.6); 
        }
        .table-row-odd { 
          background-color: rgba(255, 255, 255, 0.8); 
        }

        .table-zebra :global(.ant-table-tbody > tr:hover > td) {
          background-color: rgba(230, 247, 255, 0.8) !important;
          transform: scale(1.001);
          transition: all 0.2s ease;
        }

        .th-title { 
          font-weight: 700; 
          color: var(--text);
          font-size: 14px;
        }
        .th-center { 
          text-align: center; 
        }

        .cell-student {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 0;
        }
        .cell-student__avatar {
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: var(--shadow-xs);
        }
        .cell-student__name {
          font-weight: 700;
          color: var(--text);
          font-size: 14px;
          margin-bottom: 2px;
        }
        .cell-student__id {
          font-size: 12px;
          color: var(--muted);
        }

        .cell-company {
          padding: 4px 0;
        }
        .cell-company__name {
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .cell-company__icon { 
          color: var(--green);
          font-size: 16px;
        }

        .cell-company-main {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 0;
        }
        .cell-company-main__logo {
          border: 2px solid var(--border);
          border-radius: 12px !important;
          box-shadow: var(--shadow-xs);
        }
        .cell-company-main__name {
          font-weight: 700;
          color: var(--text);
          font-size: 16px;
          margin-bottom: 2px;
        }
        .cell-company-main__tagline {
          font-size: 12px;
          color: var(--muted);
          font-style: italic;
        }

        .cell-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .cell-count__num {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary);
          text-shadow: 0 1px 2px rgba(24, 144, 255, 0.1);
        }

        .tag-chip {
          border-radius: 16px;
          padding: 6px 12px;
          border: none !important;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .tag-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .tag-chip--blue { 
          background: linear-gradient(135deg, #e6f4ff, #d6f2ff); 
          color: #0958d9; 
        }
        .tag-chip--indigo { 
          background: linear-gradient(135deg, #eef0ff, #e6edff); 
          color: var(--indigo); 
        }
        .tag-chip--green { 
          background: linear-gradient(135deg, #f6ffed, #edf9e3); 
          color: var(--success-text); 
          border: 1px solid var(--success-border) !important; 
        }
        .tag-chip--amber { 
          background: linear-gradient(135deg, #fff7e6, #fff2d9); 
          color: #ad6800; 
        }
        .tag-chip--red { 
          background: linear-gradient(135deg, #fff1f0, #ffe7e6); 
          color: var(--red); 
        }
        .tag-chip--cyan { 
          background: linear-gradient(135deg, #e6fffb, #d9fffe); 
          color: #08979c; 
        }
        .tag-chip--gray { 
          background: linear-gradient(135deg, #f5f5f5, #efefef); 
          color: var(--muted); 
        }
        .tag-chip--gold { 
          background: linear-gradient(135deg, #fffbe6, #fff8d9); 
          color: #ad8b00; 
        }

        .tag-range {
          background: linear-gradient(135deg, var(--success-bg), #edf9e3) !important;
          border: 1px solid var(--success-border) !important;
          color: var(--success-text) !important;
          border-radius: 16px !important;
          padding: 6px 12px !important;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .tag-range:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(82, 196, 26, 0.2);
        }
        .tag-range__icon { 
          margin-right: 6px; 
          font-size: 12px;
        }

        .company-expand {
          margin: 0;
          padding: 20px 24px;
          background: linear-gradient(135deg, #fafafa, #f5f5f5);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .company-expand__title {
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .company-expand__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .company-expand__item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: var(--shadow-xs);
          transition: all 0.2s ease;
        }
        .company-expand__item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .company-expand__avatar { 
          border: 2px solid var(--border);
          box-shadow: var(--shadow-xs);
        }
        .company-expand__name { 
          font-weight: 700; 
          color: var(--text); 
          margin-bottom: 4px;
          font-size: 14px;
        }
        .company-expand__text :global(.ant-tag) { 
          margin-top: 4px; 
        }

        .students-preview { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          padding: 8px 0; 
        }
        .students-preview__row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .students-preview__row.is-alt { 
          background: linear-gradient(135deg, #f9f9f9, #f5f5f5); 
        }
        .students-preview__row:hover {
          background: linear-gradient(135deg, #e6f7ff, #d6f2ff);
          transform: translateX(2px);
        }
        .students-preview__avatar { 
          border: 1px solid #e8e8e8; 
          box-shadow: var(--shadow-xs);
        }
        .students-preview__name { 
          font-size: 13px; 
          color: #595959;
          font-weight: 600;
        }
        .students-preview__more {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #f0f0f0, #e8e8e8);
          border-radius: 8px;
          border: 2px dashed #d9d9d9;
          margin-top: 4px;
        }

        .muted { 
          color: #d9d9d9; 
        }
        .muted-italic { 
          font-size: 12px; 
          font-style: italic; 
          color: var(--muted); 
        }
        .warn-text { 
          color: #ff7875; 
          font-style: italic; 
          font-size: 13px;
          font-weight: 600;
        }
        .empty-subtext { 
          font-size: 12px; 
          margin-top: 6px; 
          color: var(--muted);
          font-style: italic;
        }

        .pagination-total { 
          color: var(--muted);
          font-weight: 500;
        }

        /* Enhanced animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .table-zebra :global(.ant-table-tbody > tr) {
          animation: fadeIn 0.3s ease-out;
        }

        /* Responsive improvements */
        @media (max-width: 768px) {
          .card-title {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
          
          .company-expand__grid {
            grid-template-columns: 1fr;
          }
          
          .students-preview__row {
            padding: 6px 8px;
          }
          
          .cell-student {
            gap: 8px;
          }
          
          .cell-company-main {
            gap: 12px;
          }
        }

        /* Scrollbar styling */
        .table-zebra :global(.ant-table-body)::-webkit-scrollbar {
          height: 8px;
        }
        .table-zebra :global(.ant-table-body)::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .table-zebra :global(.ant-table-body)::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #c1c1c1, #a8a8a8);
          border-radius: 4px;
        }
        .table-zebra :global(.ant-table-body)::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #a8a8a8, #909090);
        }
      `}</style>
    </div>
  );
};

export default AdvisorDashboard;