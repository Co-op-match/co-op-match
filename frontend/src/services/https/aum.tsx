import axios from "axios";
import type { VerifyInterface } from "../../interfaces/Verify";
import api from "./api";
const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");
const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

/* ============================ all  ============================ */
export async function GetAllStatusVerify() {
  return await api
    .get(`${apiUrl}/status_verifies`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
export async function UpdateVerifyStatus(verifyId: number, data: VerifyInterface) {
  return await axios
    .patch(`${apiUrl}/patch-verify/${verifyId}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error updating verification status:", e);
      return e.response;
    });
}

/* ============================ company  ============================ */
// สำหรับ student, company => ไม่เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllActiveCompanies() {
  return await api
    .get(`${apiUrl}/company`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}
// สำหรับ admin => เห็นข้อมูลบริษัทที่โดนลบ
export async function GetAllDeletedCompany() {
  return await api
    .get(`${apiUrl}/company/all-deleted`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching admin companies:", e);
      return e.response;
    });
}
export async function UpdateCompany(companyId: number, data: VerifyInterface) {
  return await axios
    .patch(`${apiUrl}/patch-company/${companyId}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error updating verification status:", e);
      return e.response;
    });
}
export async function DeleteCompany(companyId: number) {
  return await axios
    .delete(`${apiUrl}/company/delete/${companyId}`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error deleting company:", e);
      return e.response;
    });
}
/* export async function SuspendCompany(companyId: number) {
  return await axios
    .patch(`${apiUrl}/company/suspend/${companyId}`, {}, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error suspending company:", e);
      return e.response;
    });
} */

