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
  Card,
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
import { CreateCompany, GetAllProvinces } from "../../../../services/https";
import AddCompanyModal from "./AddCompanyModal";
import EditCompanyModal from "./EditCompanyModal";
import CompanyFormModal from "./CompanyFormModal";

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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [reload, setReload] = useState<boolean>(true);

  const totalActive = activeCompanies.length;
  const totalDeleted = deletedCompanies.length;

  const [rawProvinces, setRawProvinces] = useState<any[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<any>(null);

  useEffect(() => {
    fetchData();
    loadProvinces();
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

  const createCompany = async (values: any) => {
    try {
      const res = await CreateCompany(values);
      if (res.status === 201) {
        message.success("เพิ่มบริษัทเรียบร้อยแล้ว");
        setIsAddModalVisible(false);
        setReload(!reload);
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการเพิ่มบริษัท");
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

  /*=========================   จัดการจังหวัด   ================================*/
  const loadProvinces = async () => {
    try {
      const res = await GetAllProvinces(); // เรียกแค่ตัวเดียว
      const data = res.data || res;
      setRawProvinces(data);
      setProvinceOptions(
        data.map((p: any) => ({
          label: p.name_th,
          value: p.ID,
        }))
      );

      if (currentCompany?.Address?.Province?.ID) {
        // set ค่า default + preload ตัวเลือก
        const province = data.find(
          (p: any) => p.ID === currentCompany.Address?.Province?.ID
        );
        if (province) {
          setDistrictOptions(
            province.Districts.map((d: any) => ({
              label: d.name_th,
              value: d.ID,
            }))
          );

          const district = province.Districts.find(
            (d: any) => d.ID === currentCompany.Address?.District?.ID
          );
          if (district) {
            setSubdistrictOptions(
              district.SubDistricts.map((s: any) => ({
                label: s.name_th,
                value: s.ID,
                data: s,
              }))
            );

            const subdistrict = district.SubDistricts.find(
              (s: any) => s.ID === currentCompany.Address?.SubDistrict?.ID
            );
            if (subdistrict) {
              setSelectedSubdistrict(subdistrict);

              editForm.setFieldsValue({
                Address: {
                  Province: province.ID,
                  District: district.ID,
                  SubDistrict: subdistrict.ID,
                  Postcode: subdistrict.Postcode?.ID,
                },
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("โหลดจังหวัดล้มเหลว:", err);
    }
  };

  const handleProvinceChange = (provinceId: number) => {
    const province = rawProvinces.find((p: any) => p.ID === provinceId);
    if (province) {
      const districts = province.Districts || [];
      setDistrictOptions(
        districts.map((d: any) => ({ label: d.name_th, value: d.ID }))
      );
      setSubdistrictOptions([]);
      setSelectedSubdistrict(null);

      editForm.setFieldsValue({
        Address: {
          Province: provinceId,
          District: undefined,
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };
  const handleDistrictChange = (districtId: number) => {
    const provinceId = editForm.getFieldValue(["Address", "Province"]);
    const province = rawProvinces.find((p: any) => p.ID === provinceId);
    const district = province?.Districts.find((d: any) => d.ID === districtId);
    if (district) {
      const subs = district.SubDistricts || [];
      setSubdistrictOptions(
        subs.map((s: any) => ({
          label: s.name_th,
          value: s.ID,
          data: s,
        }))
      );
      setSelectedSubdistrict(null);

      editForm.setFieldsValue({
        Address: {
          District: districtId,
          SubDistrict: undefined,
          Postcode: undefined,
        },
      });
    }
  };
  const handleSubdistrictChange = (subId: number, option: any) => {
    setSelectedSubdistrict(option.data);

    editForm.setFieldsValue({
      Address: {
        SubDistrict: subId,
        Postcode: option.data?.Postcode?.ID,
      },
    });
  };

  /*=========================   จัดการตาราง   ================================*/
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
        <Row justify="space-between" style={{ marginBottom: "1rem" }}>
          <Col>
            <Title level={3}>บริษัท (Companies)</Title>
          </Col>
          <Col>
            <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
              เพิ่มบริษัท
            </Button>
          </Col>
          {/* <Col>
            <Flex align="center" gap={16}>
              จำนวน
              <Card
                size="small"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {tabKey == "active" ? totalActive : totalDeleted}
                </div>
              </Card>
            </Flex>
          </Col> */}
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
              <div className="summary-title">จำนวนบริษัททั้งหมด</div>
              <div className="summary-count">
                {tabKey === "active" ? totalActive : totalDeleted}
              </div>
            </div>
          </Col>
        </Row>

        <Tabs
          defaultActiveKey="active"
          onChange={(key) => setTabKey(key)}
          items={[
            { label: "บริษัททั้งหมด", key: "active" },
            { label: "บริษัทที่ถูกลบ", key: "deleted" },
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
          <Col>
            <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
              เพิ่มบริษัท
            </Button>
          </Col>
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

        {/* <EditCompanyModal
          isEditModalVisible={isEditModalVisible}
          setIsEditModalVisible={setIsEditModalVisible}
          editForm={editForm}
          currentCompany={currentCompany}
          updateCompanyData={updateCompanyData}
                    provinceOptions={provinceOptions}
          districtOptions={districtOptions}
          subdistrictOptions={subdistrictOptions}
          selectedSubdistrict={selectedSubdistrict}
          handleProvinceChange={handleProvinceChange}
          handleDistrictChange={handleDistrictChange}
          handleSubdistrictChange={handleSubdistrictChange}
        />
        <AddCompanyModal
          isVisible={isAddModalVisible}
          setIsVisible={setIsAddModalVisible}
          onSubmit={createCompany}
        /> */}
        <CompanyFormModal
          form={editForm}
          rawProvinces={rawProvinces}
          districtOptions={districtOptions}
          subdistrictOptions={subdistrictOptions}
          selectedSubdistrict={selectedSubdistrict}
          onFinish={updateCompanyData}
          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
          onSubdistrictChange={handleSubdistrictChange}
          isEdit={true}
          initialValues={{
            ...currentCompany,
            Address: {
              Province: currentCompany?.Address?.Province?.ID,
              District: currentCompany?.Address?.District?.ID,
              SubDistrict: currentCompany?.Address?.SubDistrict?.ID,
              Postcode: currentCompany?.Address?.Postcode?.ID,
            },
            created_at_formatted: dayjs(currentCompany?.CreatedAt).format(
              "DD/MM/YYYY HH:mm"
            ),
          }}
        />
      </Layout>
    </Layout>
  );
};

export default CompanyManagement;
