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
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Title from "antd/es/typography/Title";
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
import Verify_StatCard from "../../../../components/adminpage/Verify_StatCard";
import { getStatusStyle } from "../../../../components/adminpage/statusStyle";
import Verify_Modal from "../../../../components/adminpage/Verify_Modal";

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

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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

  const handleSubmitStatus = async () => {
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

    try {
      await UpdateVerifyStatus(latest.ID!, updateData);
      message.success("อัปเดตสถานะเรียบร้อยแล้ว");
      setIsModalVisible(false);
      fetchData();
    } catch (err) {
      message.error("เกิดข้อผิดพลาด");
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

  const columns: ColumnsType<AcademicStaffInterface> = [
    { title: "ID", dataIndex: "ID", key: "ID" },
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

  const filteredStaffs = useMemo(() => {
    const base = tabKey === "active" ? activeStaffs : deletedStaffs;
    const filtered = selectedFilterStatuses.length
      ? base.filter((s) =>
          selectedFilterStatuses.includes(getStaffLatestStatus(s))
        )
      : base;
    return filtered.filter((s) => {
      const name = `${s.User?.Email || ""}`.toLowerCase();
      return name.includes(searchKeyword.toLowerCase());
    });
  }, [
    activeStaffs,
    deletedStaffs,
    tabKey,
    selectedFilterStatuses,
    searchKeyword,
  ]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <div className="admin-header-box">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                <span className="admin-header-title">จัดการอาจารย์</span>
              </Title>
              <p className="admin-subtitle">ระบบจัดการและตรวจสอบสถานะอาจารย์</p>
            </Col>
          </Row>
        </div>

        <Verify_StatCard
          statusCounts={statusCounts}
          totalActive={activeStaffs.length}
          totalDeleted={deletedStaffs.length}
          tabKey={tabKey}
        />

        <Tabs
          defaultActiveKey="active"
          onChange={(key) => setTabKey(key)}
          items={[
            { label: "อาจารย์ทั้งหมด", key: "active" },
            { label: "อาจารย์ที่ถูกลบ", key: "deleted" },
          ]}
          style={{ marginTop: "1rem" }}
        />

        <Flex
          justify="center"
          align="center"
          gap="5vw"
          style={{ margin: "1rem 0" }}
        >
          <Select
            mode="multiple"
            value={selectedFilterStatuses}
            onChange={(values) => {
              if (values.includes("ทั้งหมด")) {
                const allStatuses = statusFilterOptions.filter(
                  (s) => s !== "ทั้งหมด"
                );
                const isAllSelected =
                  selectedFilterStatuses.length === allStatuses.length &&
                  allStatuses.every((s) => selectedFilterStatuses.includes(s));
                if (isAllSelected) {
                  setSelectedFilterStatuses([]);
                } else {
                  setSelectedFilterStatuses(allStatuses);
                }
              } else {
                setSelectedFilterStatuses(values);
              }
            }}
            style={{ width: "40vw" }}
            options={statusFilterOptions.map((s) => ({ label: s, value: s }))}
            placeholder="เลือกสถานะ"
            allowClear
          />
          <Input
            placeholder="ค้นหา..."
            suffix={<SearchOutlined style={{ color: "#999" }} />}
            className="searchInput"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Col></Col>
        </Flex>

        <Table
          className="adminpage-table"
          columns={columns}
          dataSource={filteredStaffs}
          rowKey="ID"
          pagination={{ pageSize: 6 }}
          size="middle"
          scroll={{ x: "max-content" }}
        />

        <Modal
          open={isModalVisible}
          title="รายละเอียดการรับรอง"
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedStatus("");
          }}
          onOk={handleSubmitStatus}
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
          submitVerificationDecision={handleSubmitStatus}
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
