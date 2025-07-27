import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Input,
  Row,
  Col,
  Button,
  Flex,
  Table,
  Modal,
  Avatar,
  Form,
  Popconfirm,
  message,
  Select,
  Radio,
  Tabs,
  Card,
  Typography,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AdminHeader from "../../../Component/AdminCoopMatchHeaderDefault";
import {
  GetAllActiveCompanies,
  GetAllDeletedCompany,
  GetAllStatusVerify,
  UpdateVerifyStatus,
} from "../../../../services/https/Admin";
import type { CompanyInterface } from "../../../../interfaces/Company";
import type { ColumnsType } from "antd/es/table";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import "../users.css";
import EditCompanyModal from "./EditCompanyModal";
import { DeleteCompany, SendEmailVerify } from "../../../../services/https";
import Verify_StatCard from "../../../../components/adminpage/Verify_StatCard";
import VerifyCompanyModal from "./VerifyCompanyModal";
import { getStatusStyle } from "../../../../components/adminpage/statusStyle";
import Verify_Modal from "../../../../components/adminpage/Verify_Modal";

const { Title, Text } = Typography;


const CompanyManagement: React.FC = () => {
  const [verifyForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [roleTabKey, setRoleTabKey] = useState("company");

  const [activeCompanies, setActiveCompanies] = useState<CompanyInterface[]>(
    []
  );
  const [deletedCompanies, setDeletedCompanies] = useState<CompanyInterface[]>(
    []
  );
  const [currentCompany, setCurrentCompany] = useState<CompanyInterface | null>(
    null
  );

  const [statusList, setStatusList] = useState<StatusVerifyInterface[]>([]);
  const [statusFilterOptions, setStatusFilterOptions] = useState<string[]>([]);
  const [selectedFilterStatuses, setSelectedFilterStatuses] = useState<
    string[]
  >([]);

  const [tabKey, setTabKey] = useState("active");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedVerifyStatus, setSelectedVerifyStatus] = useState<string>("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [reload, setReload] = useState<boolean>(true);

  const totalActive = activeCompanies.length;
  const totalDeleted = deletedCompanies.length;

  useEffect(() => {
    fetchData();
  }, [reload, currentCompany]);

  const fetchData = async () => {
    try {
      const [resActive, resDeleted, resStatuses] = await Promise.all([
        GetAllActiveCompanies(),
        GetAllDeletedCompany(),
        GetAllStatusVerify(),
      ]);

      if (resActive.status === 200) setActiveCompanies(resActive.data);
      if (resDeleted.status === 200) setDeletedCompanies(resDeleted.data);
      if (resStatuses.status === 200) {
        const names = resStatuses.data.map((s: any) => s.status_verify);
        setStatusList(resStatuses.data);
        setStatusFilterOptions(["ทั้งหมด", ...names]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
    }
  };

  const getCompanyLatestStatus = (company: CompanyInterface) => {
    const verifications = company.User?.Verifications || [];
    const latest = verifications.sort(
      (a, b) =>
        new Date(b.CreatedAt || "").getTime() -
        new Date(a.CreatedAt || "").getTime()
    )[0];
    return latest?.StatusVerify?.status_verify || "ยังไม่ได้ส่งคำขอ";
  };

  const getCompanyLatestVerification = (company: CompanyInterface) => {
    if (!company?.User?.Verifications?.length) return null;
    return [...company.User.Verifications].sort(
      (a, b) =>
        new Date(b.CreatedAt || "").getTime() -
        new Date(a.CreatedAt || "").getTime()
    )[0];
  };

  const latestVerification = currentCompany
    ? getCompanyLatestVerification(currentCompany)
    : null;
  const isReadOnlyStatus =
    latestVerification?.StatusVerify?.status_verify !== "รอรับรอง";

  const submitVerificationDecision = async (reason: string) => {
    const latest = getCompanyLatestVerification(currentCompany!);
    if (!latest) return;
    const selectedStatusObj = statusList.find(
      (s) => s.status_verify === selectedVerifyStatus
    );
    if (!selectedStatusObj) return;

    const updateData: VerifyInterface = {
      StatusVerifyID: selectedStatusObj.ID,
      AdminID: 1,
      reason: selectedVerifyStatus === "ปฏิเสธ" ? reason : "",
    };

    setIsSubmittingVerify(true); // Start loading
    try {
      await UpdateVerifyStatus(latest.ID!, updateData);
      await SendEmailVerify(latest.UserID!);
      message.success(`${selectedVerifyStatus} บริษัทเรียบร้อยแล้ว`);
      setIsDetailModalVisible(false);
      const res = await GetAllActiveCompanies();
      if (res.status === 200) setActiveCompanies(res.data);
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setIsSubmittingVerify(false); // Stop loading
    }
  };

  const showVerificationModal = (company: CompanyInterface) => {
    const latest = getCompanyLatestVerification(company);
    setCurrentCompany(company);
    setIsDetailModalVisible(true);
    setSelectedVerifyStatus(latest?.StatusVerify?.status_verify || "");

    if (latest?.StatusVerify?.status_verify === "ปฏิเสธ") {
      verifyForm.setFieldsValue({ rejectReason: latest.reason || "" });
    } else {
      verifyForm.resetFields(["rejectReason"]);
    }
  };

  const showEditCompanyModal = (company: CompanyInterface) => {
    setCurrentCompany(company);
    console.log("company: ", company);
    editForm.setFieldsValue(company);
    setIsEditModalVisible(true);
  };

  const removeCompany = async (companyId: number) => {
    const res = await DeleteCompany(companyId);
    if (res.status === 200) {
      message.success("ลบบัญชีบริษัทเรียบร้อยแล้ว");
      setReload(!reload);
    } else {
      message.error("เกิดข้อผิดพลาดในการระงับบัญชี");
    }
  };

  const filteredCompanies = useMemo(() => {
    const source = tabKey === "active" ? activeCompanies : deletedCompanies;

    const filtered = selectedFilterStatuses.length
      ? source.filter((c) =>
          selectedFilterStatuses.includes(getCompanyLatestStatus(c))
        )
      : source;

    const searched = searchKeyword
      ? filtered.filter((c) => {
          const keyword = searchKeyword.toLowerCase();
          const companyName = c.company_name?.toLowerCase() || "";
          const companyId = String(c.ID);
          const latest = getCompanyLatestVerification(c);
          const createdAt = latest?.CreatedAt
            ? dayjs(latest.CreatedAt).format("DD/MM/YYYY HH:mm")
            : "";

          return (
            companyName.includes(keyword) ||
            companyId.includes(keyword) ||
            createdAt.includes(keyword)
          );
        })
      : filtered;

    return searched.sort((a, b) => {
      const aStatus = getCompanyLatestStatus(a);
      const bStatus = getCompanyLatestStatus(b);
      return aStatus === "รอรับรอง" ? -1 : bStatus === "รอรับรอง" ? 1 : 0;
    });
  }, [
    tabKey,
    activeCompanies,
    deletedCompanies,
    selectedFilterStatuses,
    searchKeyword,
  ]);

  const statusCounts = useMemo(() => {
    const source = tabKey === "active" ? activeCompanies : deletedCompanies;
    const allStatuses = statusFilterOptions.filter((s) => s !== "ทั้งหมด");

    // เริ่มด้วยทุกสถานะ = 0
    const counts: Record<string, number> = {};
    allStatuses.forEach((status) => {
      counts[status] = 0;
    });

    // นับจริง
    for (const c of source) {
      const status = getCompanyLatestStatus(c);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    }

    return counts;
  }, [tabKey, activeCompanies, deletedCompanies, statusFilterOptions]);

  /*=========================   จัดการตาราง   ================================*/
  const columns: ColumnsType<CompanyInterface> = [
    {
      title: "ID",
      dataIndex: "ID",
      key: "ID",
      width: 80,
      sorter: (a, b) => (a.ID || 0) - (b.ID || 0),
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      width: 120,
      render: (val: string) => (
        <div style={{ fontSize: "13px", color: "#666" }}>
          {dayjs(val).format("DD/MM/YYYY")}
        </div>
      ),
      sorter: (a, b) => dayjs(a.CreatedAt).unix() - dayjs(b.CreatedAt).unix(),
    },
    {
      title: "โลโก้",
      key: "logo",
      width: 80,
      align: "center",
      render: (_, record) => {
        const logoSrc =
          record.logo?.startsWith("http") || record.logo?.startsWith("https")
            ? record.logo
            : record.logo
            ? `http://localhost:8000${record.logo}`
            : "";

        return (
          <div style={{ textAlign: "center" }}>
            <Avatar
              shape="square"
              size={50}
              src={logoSrc}
              style={{
                border: "2px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                {record.company_name?.charAt(0)}
              </span>
            </Avatar>
          </div>
        );
      },
    },
    {
      title: "บริษัท",
      key: "company",
      render: (_, record) => (
        <div>
          <a href={`/company/${record.ID}`} className="company-name-link">
            {record.company_name}
          </a>
        </div>
      ),
    },
    {
      title: "การรับรอง",
      key: "status",
      align: "center",
      width: 140,
      fixed: "right" as const,
      filters: statusFilterOptions.map((s) => ({ text: s, value: s })),
      onFilter: (val, rec) => getCompanyLatestStatus(rec) === val,
      filterMode: "tree",
      render: (_, rec) => {
        const status = getCompanyLatestStatus(rec);
        const { bgColor, textColor, border, boxShadow } =
          getStatusStyle(status);
        return (
          <Button
            onClick={() => showVerificationModal(rec)}
            className="status-button"
            style={{
              background: bgColor,
              color: textColor,
              border,
              boxShadow,
            }}
          >
            {status}
          </Button>
        );
      },
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 120,
      align: "center",
      fixed: "right" as const,
      render: (_, rec) => (
        <Flex justify="center">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditCompanyModal(rec)}
            className="action-edit-btn"
          />
          <Popconfirm
            title="ยืนยันการลบ"
            description="คุณแน่ใจหรือไม่ที่จะลบบัญชีบริษัทนี้?"
            onConfirm={() => removeCompany(rec.ID || 0)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="action-delete-btn"
            />
          </Popconfirm>
        </Flex>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <div className="admin-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                <TeamOutlined style={{ marginRight: "12px" }} />
               จัดการบริษัท
              </Title>
              <Text type="secondary">ระบบจัดการและตรวจสอบสถานะบริษัท</Text>
            </Col>
          </Row>
        </div>

        <Verify_StatCard
          statusCounts={statusCounts}
          totalActive={activeCompanies.length}
          totalDeleted={deletedCompanies.length}
          tabKey={tabKey}
        />

        {/* Main Content */}
        <Card className="admin-main-card" styles={{ body: { padding: 0 } }}>
          {/* Tabs */}
          <div style={{ padding: "24px 24px 0 24px" }}>
            <Tabs
              defaultActiveKey="active"
              onChange={(key) => setTabKey(key)}
              items={[
                {
                  label: (
                    <span style={{ fontSize: "16px", padding: "8px 16px" }}>
                      บริษัททั้งหมด
                    </span>
                  ),
                  key: "active",
                },
                {
                  label: (
                    <span style={{ fontSize: "16px", padding: "8px 16px" }}>
                      บริษัทที่ถูกลบ
                    </span>
                  ),
                  key: "deleted",
                },
              ]}
              size="large"
              className="adminpage-tabs"
            />
          </div>

          {/* Filters */}
          <div style={{ padding: "0 24px 24px 24px" }}>
            <Card
              className="admin-filter-card"
              styles={{ body: { padding: 20 } }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div className="admin-filter-label"> กรองตามสถานะ</div>
                  <Select
                    mode="multiple"
                    value={selectedFilterStatuses}
                    onChange={(values) => {
                      if (values.includes("ทั้งหมด")) {
                        const allStatuses = statusFilterOptions.filter(
                          (s) => s !== "ทั้งหมด"
                        );
                        const isAllSelected =
                          selectedFilterStatuses.length ===
                            allStatuses.length &&
                          allStatuses.every((s) =>
                            selectedFilterStatuses.includes(s)
                          );

                        if (isAllSelected) {
                          setSelectedFilterStatuses([]); // unselect all
                        } else {
                          setSelectedFilterStatuses(allStatuses); // select all
                        }
                      } else {
                        setSelectedFilterStatuses(values);
                      }
                    }}
                    style={{ width: "100%" }}
                    size="large"
                    options={statusFilterOptions.map((s) => ({
                      label: s,
                      value: s,
                    }))}
                    placeholder="เลือกสถานะที่ต้องการแสดง"
                    allowClear
                    maxTagCount="responsive"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div className="admin-filter-label">ค้นหาบริษัท</div>
                  <Input
                    placeholder="ค้นหาชื่อบริษัท, ID หรือข้อมูลอื่นๆ..."
                    suffix={
                      <SearchOutlined
                        style={{ color: "#bfbfbf", fontSize: "16px" }}
                      />
                    }
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    size="large"
                    className="admin-search-input"
                  />
                </Col>
              </Row>
            </Card>
          </div>

          {/* Table */}
          <div style={{ padding: "0 24px 24px 24px" }}>
            <Table
              columns={columns}
              dataSource={filteredCompanies.map((c) => ({ ...c, key: c.ID }))}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                pageSizeOptions: ["8", "16", "32", "50"],
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
                style: { marginTop: "16px" },
              }}
              size="middle"
              scroll={{ x: 800 }}
              className="adminpage-table"
              bordered={false}
            />
          </div>
        </Card>

        <Verify_Modal
          open={isDetailModalVisible}
          entity={currentCompany!}
          role={currentCompany?.User?.Role!}
          verifyForm={verifyForm}
          selectedVerifyStatus={selectedVerifyStatus}
          setSelectedVerifyStatus={setSelectedVerifyStatus}
          isReadOnlyStatus={isReadOnlyStatus}
          setIsDetailModalVisible={setIsDetailModalVisible}
          submitVerificationDecision={submitVerificationDecision}
          isSubmitting={isSubmittingVerify}
        />

        <EditCompanyModal
          isEditModalVisible={isEditModalVisible}
          setIsEditModalVisible={setIsEditModalVisible}
          editForm={editForm}
          currentCompany={currentCompany}
          setReload={setReload}
          reload={reload}
        />
      </Layout>
    </Layout>
  );
};

export default CompanyManagement;
