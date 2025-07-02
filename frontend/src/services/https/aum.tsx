import axios from "axios";
import type { VerifyInterface } from "../../interfaces/Verify";

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
  return await axios
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
export async function GetAllCompany() {
  return await axios
    .get(`${apiUrl}/company`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
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