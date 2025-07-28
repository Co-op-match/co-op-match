export interface StatusStyle {
  bgColor: string;
  textColor: string;
  border: string;
  boxShadow: string;
}

export const getStatusStyle = (status: string): StatusStyle => {
  switch (status) {
    case "รับรอง":
    case "เปิดรับสมัคร":
      return {
        bgColor: "linear-gradient(135deg, #52c41a, #73d13d)",
        textColor: "#fff",
        border: "none",
        boxShadow: "0 2px 8px rgba(82, 196, 26, 0.3)",
      };
    case "ปฏิเสธ":
      return {
        bgColor: "linear-gradient(135deg, #ff4d4f, #ff7875)",
        textColor: "#fff",
        border: "none",
        boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
      };
    case "รอตรวจสอบ":
    case "รอรับรอง":
      return {
        bgColor: "linear-gradient(135deg, #faad14, #ffc53d)",
        textColor: "#fff",
        border: "none",
        boxShadow: "0 2px 8px rgba(250, 173, 20, 0.3)",
      };
    default:
      return {
        bgColor: "#fff",
        textColor: "#666",
        border: "1px solid #d9d9d9",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      };
  }
};
