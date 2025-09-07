import axios from "axios";
const apiUrl = "api.coop-match.online";

function getAuthHeader() {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");
  return Authorization && Bearer ? `${Bearer} ${Authorization}` : "";
}

function jsonOptions() {
  return {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
  } as const;
}

function formDataOptions() {
  return {
    withCredentials: true,
    headers: {
      //"Content-Type": "multipart/form-data",
      Authorization: getAuthHeader(),
    },
  } as const;
}

export async function ListArticles(params?: { type?: "news"|"career"; q?: string; is_published?: boolean; }) {
  const query: any = {};
  if (params?.type) query.type = params.type;
  if (params?.q) query.q = params.q;
  if (typeof params?.is_published === "boolean") query.is_published = String(params.is_published);
  return await axios.get(`${apiUrl}/articles`, { ...jsonOptions(), params: query })
    .then(res => res).catch(e => e.response);
}

export async function CreateArticle(data: FormData | any) {
  const isFD = typeof FormData !== "undefined" && data instanceof FormData;
  return await axios.post(`${apiUrl}/articles`, data, isFD ? formDataOptions() : jsonOptions())
    .then(res => res).catch(e => e.response);
}

export async function UpdateArticle(id: number, data: FormData | any) {
  const isFD = data instanceof FormData;
  try {
    const res = await axios.put(
      `${apiUrl}/articles/${id}`,
      data,
      isFD ? formDataOptions() : jsonOptions()
    );
    return res;
  } catch (e: any) {
    return e.response ?? { status: 500, data: { message: e.message } };
  }
}


export async function DeleteArticle(id: number) {
  return await axios.delete(`${apiUrl}/articles/${id}`, jsonOptions())
    .then(res => res).catch(e => e.response);
}


// ------------------------ Helpers สำหรับ StudentDashboard ------------------------
// ดึงเฉพาะรายการที่ "เผยแพร่แล้ว" ตามชนิด (news/career)
export async function ListPublishedNews(q?: string) {
  return await ListArticles({ type: "news", is_published: true, q });
}

export async function ListPublishedCareer(q?: string) {
  return await ListArticles({ type: "career", is_published: true, q });
}