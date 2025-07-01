import axios from "axios";

const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");
const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

/*============================ all  ============================*/
export async function GetAllStatusVerify() {
  return await axios
    .get(`${apiUrl}/status_verifies`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}

/*============================ company  ============================*/
export async function GetAllCompany() {
  return await axios
    .get(`${apiUrl}/admin/all`, requestOptions)
    .then((res) => res)
    .catch((e) => {
      console.error("Error fetching data:", e);
      return e.response;
    });
}