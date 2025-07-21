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
import AdminHeader from "../../../Component/AdminNavbar";
import {
  GetAllStatusVerify,
  GetAllActiveAcademicStaffs,
  GetAllDeletedAcademicStaffs,
  UpdateVerifyStatus,
  DeleteAcademicStaff,
} from "../../../../services/https/aum";
import type { AcademicStaffInterface } from "../../../../interfaces/AcademicStaff";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import EditLecturersModal from "./EditLecturersModal";
import AddLecturersModal from "./AddLecturersModal";

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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "รับรอง":
        return { bgColor: "#52c41a", textColor: "#fff", border: "none" };
      case "ปฏิเสธ":
        return { bgColor: "#ff4d4f", textColor: "#fff", border: "none" };
      case "รอรับรอง":
        return { bgColor: "#faad14", textColor: "#fff", border: "none" };
      default:
        return {
          bgColor: "#fff",
          textColor: "#000",
          border: "1px solid rgba(0,0,0,0.2)",
        };
    }
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
      fixed: "right" as const,
      align: "center" as const,
      filters: statusFilterOptions.map((s) => ({ text: s, value: s })),
      onFilter: (val: any, rec: any) => getStaffLatestStatus(rec) === val,
      filterMode: "tree" as const,
      render: (_: any, rec: AcademicStaffInterface) => {
        const status = getStaffLatestStatus(rec);
        const { bgColor, textColor, border } = getStatusStyle(status);
        return (
          <Button
            onClick={() => {
              setSelectedStaff(rec);
              setIsModalVisible(true);
              setSelectedStatus(status);
              form.setFieldsValue({
                rejectReason: getLatestVerification(rec)?.reason,
              });
            }}
            style={{
              width: 110,
              borderRadius: 12,
              backgroundColor: bgColor,
              color: textColor,
              border,
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
      fixed: "right" as const,
      render: (_: any, rec: AcademicStaffInterface) => (
        <Flex gap={16}>
          <EditOutlined
            style={{ fontSize: 18, cursor: "pointer" }}
            onClick={() => showEditStaffModal(rec)}
          />
          <Popconfirm
            title="คุณแน่ใจหรือไม่ที่จะลบอาจารย์คนนี้?"
            onConfirm={() => handleDeleteStaff(rec.ID)}
          >
            <DeleteOutlined style={{ cursor: "pointer", color: "red" }} />
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
        <Row justify="space-between" style={{ marginBottom: "1rem" }}>
          <Col>
            <Title level={3}>อาจารย์ (Academic Staff)</Title>
          </Col>
        </Row>

        <Row gutter={[16, 16]} justify="center" style={{ marginTop: 12 }} wrap>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Col key={status}>
              <div className="custom-summary-box">
                <div className="summary-title">{status}</div>
                <div className="summary-count">{count}</div>
              </div>
            </Col>
          ))}
          <Col>
            <div className="custom-summary-box highlight-box">
              <div className="summary-title">จำนวนอาจารย์ทั้งหมด</div>
              <div className="summary-count">
                {tabKey === "active"
                  ? activeStaffs.length
                  : deletedStaffs.length}
              </div>
            </div>
          </Col>
        </Row>

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
          <Col>
            <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
              เพิ่มอาจารย์
            </Button>
          </Col>
        </Flex>

        <Table
          className="custom-table"
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

        <EditLecturersModal
          isEditModalVisible={isEditModalVisible}
          setIsEditModalVisible={setIsEditModalVisible}
          editForm={editForm}
          selectedStaff={selectedStaff}
          setReload={setReload}
          reload={reload}
        />
        <AddLecturersModal
          isAddModalVisible={isAddModalVisible}
          setIsAddModalVisible={setIsAddModalVisible}
          setReload={setReload}
          reload={reload}
        />
      </Layout>
    </Layout>
  );
};

export default AcademicStaffManagement;
