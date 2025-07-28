import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Table,
  Input,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Radio,
  message,
  Select,
  Flex,
  Tabs,
  Popconfirm,
  Card,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import "../users.css";
import AdminHeader from "../../../Component/AdminCoopMatchHeaderDefault";
import {
  GetAllStatusVerify,
  GetAllActiveAcademicStaffs,
  GetAllDeletedAcademicStaffs,
  UpdateVerifyStatus,
  DeleteAcademicStaff,
} from "../../../../services/https/Admin";
import type { AcademicStaffInterface } from "../../../../interfaces/AcademicStaff";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import EditLecturersModal from "./EditLecturersModal";
import User_StatCard from "../../../../components/adminpage/verify/User_StatCard";
import { getStatusStyle } from "../../../../components/adminpage/verify/statusStyle";
import Verify_Modal from "../../../../components/adminpage/verify/Verify_Modal";
import { SendEmailVerify } from "../../../../services/https";
import RoleTabs from "../../../../components/adminpage/verify/User_RoleTabs";
import PageHeaderSection from "../../../../components/adminpage/verify/User_PageHeaderSection";

const AcademicStaffManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [reload, setReload] = useState<boolean>(true);

  const [activeStaffs, setActiveStaffs] = useState<AcademicStaffInterface[]>(
    []
  );
  const [deletedStaffs, setDeletedStaffs] = useState<AcademicStaffInterface[]>(
    []
  );
  const [selectedStaff, setSelectedStaff] = useState<AcademicStaffInterface>(
    {} as AcademicStaffInterface
  );

  const [statusList, setStatusList] = useState<StatusVerifyInterface[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusFilterOptions, setStatusFilterOptions] = useState<string[]>([]);
  const [selectedFilterStatuses, setSelectedFilterStatuses] = useState<
    string[]
  >([]);
  const [tabKey, setTabKey] = useState("active");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
  });

  useEffect(() => {
    fetchData();
  }, [selectedStaff, reload]);

  const fetchData = async () => {
    const [resActive, resDeleted, resStatus] = await Promise.all([
      GetAllActiveAcademicStaffs(),
      GetAllDeletedAcademicStaffs(),
      GetAllStatusVerify(),
    ]);

    if (resActive.status === 200) setActiveStaffs(resActive.data);
    if (resDeleted.status === 200) setDeletedStaffs(resDeleted.data);
    if (resStatus.status === 200) {
      setStatusList(resStatus.data);
      setStatusFilterOptions([
        "ทั้งหมด",
        ...resStatus.data.map((s: any) => s.status_verify),
      ]);
    }
  };

  const getLatestVerification = (staff: AcademicStaffInterface) => {
    const verifications = staff.User?.Verifications || [];
    return verifications.sort(
      (a, b) =>
        new Date(b.CreatedAt || "").getTime() -
        new Date(a.CreatedAt || "").getTime()
    )[0];
  };

  const getStaffLatestStatus = (staff: AcademicStaffInterface) => {
    const verifications = staff.User?.Verifications || [];
    const latest = verifications.sort(
      (a, b) =>
        new Date(b.CreatedAt || "").getTime() -
        new Date(a.CreatedAt || "").getTime()
    )[0];
    return latest?.StatusVerify?.status_verify || "ยังไม่ได้ส่งคำขอ";
  };

  const statusCounts = useMemo(() => {
    const source = tabKey === "active" ? activeStaffs : deletedStaffs;
    const allStatuses = statusFilterOptions.filter((s) => s !== "ทั้งหมด");
    const counts: Record<string, number> = {};
    allStatuses.forEach((status) => {
      counts[status] = 0;
    });
    for (const s of source) {
      const status = getStaffLatestStatus(s);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    }
    return counts;
  }, [tabKey, activeStaffs, deletedStaffs, statusFilterOptions]);

  const submitVerificationDecision = async () => {
    const latest = getLatestVerification(selectedStaff!);
    const selectedStatusObj = statusList.find(
      (s) => s.status_verify === selectedStatus
    );
    if (!latest || !selectedStatusObj) return;

    const reason = form.getFieldValue("rejectReason") || "";
    const updateData: VerifyInterface = {
      StatusVerifyID: selectedStatusObj.ID,
      AdminID: 1,
      reason: selectedStatus === "ปฏิเสธ" ? reason : "",
    };

    setIsSubmittingVerify(true); // Start loading
    try {
      await UpdateVerifyStatus(latest.ID!, updateData);
      await SendEmailVerify(latest.UserID!);
      message.success("อัปเดตสถานะเรียบร้อยแล้ว");
      setIsModalVisible(false);
      fetchData();
    } catch (err) {
      message.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmittingVerify(false); // Stop loading
    }
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      const res = await DeleteAcademicStaff(id);
      if (res.status === 200) {
        message.success("ลบอาจารย์สำเร็จ");
        fetchData();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (err) {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const showVerificationModal = (staff: AcademicStaffInterface) => {
    const latest = getLatestVerification(staff);
    setSelectedStaff(staff);
    setIsModalVisible(true);
    setSelectedStatus(latest?.StatusVerify?.status_verify || "");

    if (latest?.StatusVerify?.status_verify === "ปฏิเสธ") {
      form.setFieldsValue({ rejectReason: latest.reason || "" });
    } else {
      form.resetFields(["rejectReason"]);
    }
  };

  const showEditStaffModal = (staff: AcademicStaffInterface) => {
    setSelectedStaff(staff);
    console.log("staff: ", staff);
    editForm.setFieldsValue(staff);
    setIsEditModalVisible(true);
  };

  const filteredStaffs = useMemo(() => {
    const base = tabKey === "active" ? activeStaffs : deletedStaffs;

    const filtered = selectedFilterStatuses.length
      ? base.filter((s) =>
          selectedFilterStatuses.includes(getStaffLatestStatus(s))
        )
      : base;

    return filtered.filter((s) => {
      const keyword = searchKeyword.toLowerCase();

      return (
        (s.User?.Email || "").toLowerCase().includes(keyword) ||
        (s.university || "").toLowerCase().includes(keyword) ||
        (s.faculty || "").toLowerCase().includes(keyword) ||
        (s.department || "").toLowerCase().includes(keyword) ||
        (s.academic_position || "").toLowerCase().includes(keyword)
      );
    });
  }, [
    activeStaffs,
    deletedStaffs,
    tabKey,
    selectedFilterStatuses,
    searchKeyword,
  ]);

  const role = activeStaffs[0]?.User?.Role;

  const columns: ColumnsType<AcademicStaffInterface> = [
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
      title: "อีเมล",
      key: "Email",
      render: (_: any, rec: AcademicStaffInterface) =>
        `${rec.User?.Email || ""}`,
    },
    { title: "มหาวิทยาลัย", dataIndex: "university", key: "university" },
    { title: "คณะ", dataIndex: "faculty", key: "faculty" },
    { title: "ภาควิชา", dataIndex: "department", key: "department" },
    {
      title: "ตำแหน่ง",
      dataIndex: "academic_position",
      key: "academic_position",
    },
    {
      title: "การรับรอง",
      key: "status",
      align: "center",
      width: 140,
      fixed: "right" as const,
      filters: statusFilterOptions.map((s) => ({ text: s, value: s })),
      onFilter: (val, rec) => getStaffLatestStatus(rec) === val,
      filterMode: "tree",
      render: (_, rec) => {
        const status = getStaffLatestStatus(rec);
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
            onClick={() => showEditStaffModal(rec)}
            className="action-edit-btn"
          />
          <Popconfirm
            title="ยืนยันการลบ"
            description="คุณแน่ใจหรือไม่ที่จะลบบัญชีบริษัทนี้?"
            onConfirm={() => handleDeleteStaff(rec.ID)}
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
        <PageHeaderSection
          role={role!}
          onAddClick={() => setIsAddModalVisible(true)}
        />

        <User_StatCard
          statusCounts={statusCounts}
          totalActive={activeStaffs.length}
          totalDeleted={deletedStaffs.length}
          tabKey={tabKey}
        />

        {/* Main Content */}
        <Card className="admin-main-card" styles={{ body: { padding: 0 } }}>
          {/* Tabs */}
          <div style={{ padding: "24px 24px 0 24px" }}>
            {role && (
              <RoleTabs tabKey={tabKey} setTabKey={setTabKey} role={role} />
            )}
          </div>

          {/* Filters */}
          <div style={{ padding: "0 24px 24px 24px" }}>
            <Card
              className="admin-filter-card"
              styles={{ body: { padding: 20 } }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div className="admin-filter-label">กรองตามสถานะ</div>
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
                        setSelectedFilterStatuses(
                          isAllSelected ? [] : allStatuses
                        );
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
                  <div className="admin-filter-label">ค้นหาอาจารย์</div>
                  <Input
                    placeholder="ค้นหาอีเมล, มหาวิทยาลัย หรือข้อมูลอื่นๆ..."
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
              dataSource={filteredStaffs.map((s) => ({ ...s, key: s.ID }))}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} จาก ${total} รายการ`,
                onChange: (page, pageSize) => {
                  setPagination({ current: page, pageSize });
                },
              }}
              size="middle"
              scroll={{ x: 800 }}
              className="adminpage-table"
              bordered={false}
            />
          </div>
        </Card>

        <Modal
          open={isModalVisible}
          title="รายละเอียดการรับรอง"
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedStatus("");
          }}
          onOk={submitVerificationDecision}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          footer={
            getStaffLatestStatus(selectedStaff) === "รอรับรอง"
              ? undefined
              : null
          }
        >
          <Form form={form} layout="vertical">
            <p>
              <strong>อีเมล:</strong> {selectedStaff?.User?.Email}
            </p>
            {(() => {
              const latest = getLatestVerification(selectedStaff);
              if (!latest) return <p>ยังไม่มีการส่งคำขอรับรอง</p>;
              return (
                <>
                  <p>
                    <strong>สถานะ:</strong>{" "}
                    {latest?.StatusVerify?.status_verify || "ไม่ทราบสถานะ"}
                  </p>
                  <p>
                    <strong>วันที่ส่งคำขอ:</strong>{" "}
                    {dayjs(latest?.CreatedAt).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p>
                    <strong>วันที่ยืนยัน:</strong>{" "}
                    {latest?.UpdatedAt
                      ? dayjs(latest?.UpdatedAt).format("DD/MM/YYYY HH:mm")
                      : "-"}
                  </p>
                  <p>
                    <strong>เอกสารการยืนยัน:</strong>
                  </p>
                  {(() => {
                    const url = latest.verification_document
                      ? `http://localhost:8000${latest.verification_document}`
                      : undefined;

                    if (!url) {
                      return <p style={{ color: "gray" }}>ไม่มีเอกสาร</p>;
                    }

                    return (
                      <iframe
                        src={url}
                        title="Verification Document"
                        width="100%"
                        height="500px"
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: 8,
                        }}
                      />
                    );
                  })()}

                  <Radio.Group
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      if (e.target.value !== "ปฏิเสธ")
                        form.resetFields(["rejectReason"]);
                    }}
                    value={selectedStatus}
                    style={{ marginTop: 16 }}
                    disabled={
                      getStaffLatestStatus(selectedStaff) !== "รอรับรอง"
                    }
                  >
                    <Radio value="รับรอง">รับรอง</Radio>
                    <Radio value="ปฏิเสธ">ปฏิเสธ</Radio>
                  </Radio.Group>
                  {selectedStatus === "ปฏิเสธ" && (
                    <Form.Item
                      name="rejectReason"
                      rules={[
                        {
                          required: true,
                          message: "กรุณาระบุเหตุผลในการปฏิเสธ",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="กรุณาระบุเหตุผลในการปฏิเสธ"
                        disabled={
                          getStaffLatestStatus(selectedStaff) !== "รอรับรอง"
                        }
                      />
                    </Form.Item>
                  )}
                </>
              );
            })()}
          </Form>
        </Modal>

        <Verify_Modal
          open={isModalVisible}
          entity={selectedStaff}
          role={selectedStaff.User?.Role!}
          verifyForm={form}
          selectedVerifyStatus={selectedStatus}
          setSelectedVerifyStatus={setSelectedStatus}
          isReadOnlyStatus={getStaffLatestStatus(selectedStaff) !== "รอรับรอง"}
          setIsDetailModalVisible={setIsModalVisible}
          submitVerificationDecision={submitVerificationDecision}
          isSubmitting={isSubmittingVerify}
        />

        <EditLecturersModal
          isEditModalVisible={isEditModalVisible}
          setIsEditModalVisible={setIsEditModalVisible}
          editForm={editForm}
          selectedStaff={selectedStaff}
          setReload={setReload}
          reload={reload}
        />
      </Layout>
    </Layout>
  );
};

export default AcademicStaffManagement;
