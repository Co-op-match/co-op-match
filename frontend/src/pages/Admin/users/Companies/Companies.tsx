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
  Image,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import AdminHeader from "../../../Component/AdminNavbar";
import {
  DeleteCompany,
  GetAllActiveCompanies,
  GetAllDeletedCompany,
  GetAllStatusVerify,
  UpdateCompany,
  UpdateVerifyStatus,
} from "../../../../services/https/aum";
import type { CompanyInterface } from "../../../../interfaces/Company";
import type { ColumnsType } from "antd/es/table";
import type { StatusVerifyInterface } from "../../../../interfaces/StatusVerify";
import type { VerifyInterface } from "../../../../interfaces/Verify";
import "../users.css";
import CompanyEditModal from "./CompanyEditModal";

const CompanyManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

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
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [reload, setReload] = useState<boolean>(true);

  useEffect(() => {
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
    fetchData();
  }, [reload]);

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

    try {
      await UpdateVerifyStatus(latest.ID!, updateData);
      message.success(`${selectedVerifyStatus} บริษัทเรียบร้อยแล้ว`);
      setIsDetailModalVisible(false);
      const res = await GetAllActiveCompanies();
      if (res.status === 200) setActiveCompanies(res.data);
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const showVerificationModal = (company: CompanyInterface) => {
    const latest = getCompanyLatestVerification(company);
    setCurrentCompany(company);
    setIsDetailModalVisible(true);
    setSelectedVerifyStatus(latest?.StatusVerify?.status_verify || "");

    if (latest?.StatusVerify?.status_verify === "ปฏิเสธ") {
      form.setFieldsValue({ rejectReason: latest.reason || "" });
    } else {
      form.resetFields(["rejectReason"]);
    }
  };

  const showEditCompanyModal = (company: CompanyInterface) => {
    setCurrentCompany(company);
    console.log("company: ", company);
    editForm.setFieldsValue(company);
    setIsEditModalVisible(true);
  };

  const updateCompanyData = async (values: any) => {
    try {
      const res = await UpdateCompany(currentCompany?.ID!, {
        ...values,
        address_id: currentCompany?.address_id, // แนบไว้ถ้ามี
        admin_id: currentCompany?.admin_id,
      });
      if (res.status === 200) {
        message.success("อัปเดตข้อมูลบริษัทเรียบร้อยแล้ว");
        setIsEditModalVisible(false);
        setReload(!reload);
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
      console.error(err);
    }
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
      ? filtered.filter((c) =>
          c.company_name?.toLowerCase().includes(searchKeyword.toLowerCase())
        )
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "รับรอง":
        return { bgColor: "#007AFF", textColor: "#fff", border: "none" };
      case "ปฏิเสธ":
        return { bgColor: "#FF4D4F", textColor: "#fff", border: "none" };
      case "รอรับรอง":
        return { bgColor: "#d9d9d9", textColor: "#000", border: "none" };
      default:
        return {
          bgColor: "#fff",
          textColor: "#000",
          border: "1px solid rgba(0,0,0,0.2)",
        };
    }
  };

  const columns: ColumnsType<CompanyInterface> = [
    { title: "ID", dataIndex: "ID", key: "ID" },
    {
      title: "วันที่สมัคร",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY"),
    },
    {
      title: "โลโก้",
      key: "logo",
      render: (_, record) => (
        <Avatar shape="square" size="large" src={record.logo || undefined}>
          {record.company_name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "บริษัท",
      key: "company",
      render: (_, record) => (
        <a href={`/company/${record.ID}`} style={{ color: "#1677ff" }}>
          {record.company_name}
        </a>
      ),
    },
    {
      title: "การรับรอง",
      key: "status",
      align: "center",
      filters: statusFilterOptions.map((s) => ({ text: s, value: s })),
      onFilter: (val, rec) => getCompanyLatestStatus(rec) === val,
      filterMode: "tree",
      render: (_, rec) => {
        const status = getCompanyLatestStatus(rec);
        const { bgColor, textColor, border } = getStatusStyle(status);
        return (
          <Button
            onClick={() => showVerificationModal(rec)}
            style={{
              width: 100,
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
      render: (_, rec) => (
        <Flex gap={16}>
          <EditOutlined
            style={{ fontSize: 18, cursor: "pointer" }}
            onClick={() => showEditCompanyModal(rec)}
          />
          <Popconfirm
            title="คุณแน่ใจหรือไม่ที่จะลบบัญชีบริษัทนี้?"
            onConfirm={() => removeCompany(rec.ID || 0)}
          >
            <DeleteOutlined style={{ cursor: "pointer", color: "red" }} />
          </Popconfirm>
        </Flex>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminHeader />
      <Layout style={{ margin: "2rem" }}>
        <Row justify="space-between">
          <Col>
            <Title level={3}>บริษัท (Companies)</Title>
          </Col>
          <Col>
            <Flex align="center" gap={16}>
              จำนวน
              <span style={{ fontSize: 18, fontWeight: "bold" }}>
                {activeCompanies.length}
              </span>
            </Flex>
          </Col>
        </Row>
        <Tabs
          defaultActiveKey="active"
          onChange={(key) => setTabKey(key)}
          items={[
            { label: "บริษัททั้งหมด", key: "active" },
            { label: "บริษัทที่ถูกลบ", key: "deleted" },
          ]}
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
                  setSelectedFilterStatuses([]); // unselect all
                } else {
                  setSelectedFilterStatuses(allStatuses); // select all
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
        </Flex>
        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredCompanies}
          pagination={{ pageSize: 6 }}
          size="middle"
        />
        <Modal
          open={isDetailModalVisible}
          title="รายละเอียดการรับรอง"
          onCancel={() => {
            setIsDetailModalVisible(false);
            form.resetFields();
            setSelectedVerifyStatus("");
          }}
          onOk={async () => {
            if (isReadOnlyStatus) return;
            try {
              if (selectedVerifyStatus === "ปฏิเสธ") {
                await form.validateFields();
              }
              const reason = form.getFieldValue("rejectReason") || "";
              await submitVerificationDecision(reason);
            } catch (err) {}
          }}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          footer={isReadOnlyStatus ? null : undefined}
        >
          <Form form={form} layout="vertical">
            <p>
              <strong>บริษัท:</strong> {currentCompany?.company_name}
            </p>
            {(() => {
              const latest = getCompanyLatestVerification(currentCompany!);
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
                    const url = latest.verification_document;
                    const ext = url?.split(".").pop()?.toLowerCase();
                    if (!url)
                      return <p style={{ color: "gray" }}>ไม่มีเอกสาร</p>;
                    if (["png", "jpg", "jpeg", "webp"].includes(ext!)) {
                      return (
                        <img
                          src={url}
                          alt="Verification Document"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            borderRadius: 8,
                          }}
                        />
                      );
                    } else if (ext === "pdf") {
                      return (
                        <iframe
                          src={url}
                          title="PDF Document"
                          width="100%"
                          height="500px"
                          style={{ border: "1px solid #ccc", borderRadius: 8 }}
                        />
                      );
                    } else {
                      return (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          คลิกเพื่อเปิดเอกสาร
                        </a>
                      );
                    }
                  })()}
                  <Radio.Group
                    onChange={(e) => {
                      setSelectedVerifyStatus(e.target.value);
                      if (e.target.value !== "ปฏิเสธ")
                        form.resetFields(["rejectReason"]);
                    }}
                    value={selectedVerifyStatus}
                    style={{ marginTop: 16 }}
                    disabled={isReadOnlyStatus}
                  >
                    <Radio value="รับรอง">รับรอง</Radio>
                    <Radio value="ปฏิเสธ">ปฏิเสธ</Radio>
                  </Radio.Group>
                  {selectedVerifyStatus === "ปฏิเสธ" && (
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
                        disabled={isReadOnlyStatus}
                      />
                    </Form.Item>
                  )}
                </>
              );
            })()}
          </Form>
        </Modal>

        <CompanyEditModal
          isEditModalVisible={isEditModalVisible}
          setIsEditModalVisible={setIsEditModalVisible}
          editForm={editForm}
          currentCompany={currentCompany}
          updateCompanyData={updateCompanyData}
        />

        {/*         <Modal
          title="แก้ไขข้อมูลบริษัท"
          open={isEditModalVisible}
          onOk={() => editForm.submit()}
          onCancel={() => setIsEditModalVisible(false)}
          okText="บันทึก"
          cancelText="ยกเลิก"
          width={800}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={updateCompanyData}
            initialValues={{
              ...currentCompany,
              Address: currentCompany?.Address,
              created_at_formatted: dayjs(currentCompany?.CreatedAt).format(
                "DD/MM/YYYY HH:mm"
              ),
            }}
            key={currentCompany?.ID} // to force re-render when switching companies
          >
            <Row gutter={24}>
              <Col span={16}>
                <Form.Item
                  name="company_name"
                  label="ชื่อบริษัท"
                  rules={[{ required: true, message: "กรุณาระบุชื่อบริษัท" }]}
                >
                  <Input placeholder="ชื่อบริษัท" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="logo"
                  label="โลโก้ (URL)"
                  rules={[{ type: "url", message: "URL โลโก้ไม่ถูกต้อง" }]}
                >
                  <Input placeholder="https://example.com/logo.png" />
                </Form.Item>
              </Col>
            </Row>

            {editForm.getFieldValue("logo") && (
              <Row justify="start" style={{ marginBottom: 24 }}>
                <Col>
                  <p>ตัวอย่างโลโก้:</p>
                  <Image
                    src={editForm.getFieldValue("logo")}
                    alt="โลโก้บริษัท"
                    width={150}
                    height={150}
                    style={{
                      objectFit: "contain",
                      border: "1px solid #ccc",
                      padding: 8,
                    }}
                  />
                </Col>
              </Row>
            )}

            <Title level={5} style={{ marginTop: 16 }}>
              ที่อยู่
            </Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["Address", "house_number"]}
                  label="บ้านเลขที่"
                  rules={[{ required: true, message: "กรุณาระบุบ้านเลขที่" }]}
                >
                  <Input placeholder="เช่น 1/22" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["Address", "village"]} label="หมู่บ้าน">
                  <Input placeholder="เช่น หมู่บ้าน A" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={["Address", "street"]} label="ถนน">
                  <Input placeholder="เช่น ถนนพหลโยธิน" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["Address", "sub_street"]} label="ซอย">
                  <Input placeholder="เช่น ซอย 1" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["Address", "province"]}
                  label="จังหวัด"
                  rules={[{ required: true, message: "กรุณาระบุจังหวัด" }]}
                >
                  <Input placeholder="เช่น นครปฐม" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["Address", "district"]}
                  label="อำเภอ / เขต"
                  rules={[{ required: true, message: "กรุณาระบุอำเภอ / เขต" }]}
                >
                  <Input placeholder="เช่น เมืองนครปฐม" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["Address", "subdistrict"]}
                  label="ตำบล / แขวง"
                  rules={[{ required: true, message: "กรุณาระบุตำบล / แขวง" }]}
                >
                  <Input placeholder="เช่น ห้วยจรเข้" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["Address", "post_code"]}
                  label="รหัสไปรษณีย์"
                  rules={[{ required: true, message: "กรุณาระบุรหัสไปรษณีย์" }]}
                >
                  <Input placeholder="เช่น 73000" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="created_at_formatted" label="วันที่สมัคร">
              <Input disabled />
            </Form.Item>
          </Form>
        </Modal> */}
      </Layout>
    </Layout>
  );
};

export default CompanyManagement;
