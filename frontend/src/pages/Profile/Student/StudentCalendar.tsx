import React, { useState, useEffect } from "react";
import { Card, Select } from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./StudentCalendarCard.css";
import { GetEventsStudentByUserId } from "../../../services/https";

interface EventItem {
  date: string;
  content: string;
}


const StudentCalendarCard: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
    const [events, setEvents] = useState<EventItem[]>([]);
    const { Option } = Select;
    
useEffect(() => {
  const userIdStr = localStorage.getItem("id");
  const userId = userIdStr ? parseInt(userIdStr) : null;
  if (!userId) return;

  GetEventsStudentByUserId(userId).then((result) => {
    console.log("✅ Loaded events:", result); // ⬅ เพิ่ม log
    setEvents(result); 
  });
}, []);


  const monthsTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
const currentYear = dayjs().year();
const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i);

  const getDaysInMonth = (date: dayjs.Dayjs) => {
    const startOfMonth = date.startOf("month");
    const endOfMonth = date.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");
    const days = [];
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  };

  const hasEvent = (date: dayjs.Dayjs) =>
  Array.isArray(events) && events.some(event => event.date === date.format("YYYY-MM-DD"));

const filteredEvents = selectedDate && Array.isArray(events)
  ? events.filter(e => dayjs(e.date).isSame(selectedDate, "day"))
  : Array.isArray(events)
    ? [...events].sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
    : [];

  const days = getDaysInMonth(currentDate);
  const today = dayjs();

  return (
    <Card title="ปฏิทินแจ้งเตือน" bordered className="calendar-card" headStyle={{ background: "transparent" }}>
      <div className="calendar-container">
        <div className="calendar-section">
<div className="calendar-header">
  {/* ปุ่มเลื่อนเดือน */}
  <button onClick={() => setCurrentDate(prev => prev.subtract(1, "month"))} className="calendar-nav-btn">
    <LeftOutlined />
  </button>

  {/* Dropdown เลือกเดือน */}
  <Select
    value={currentDate.month()}
    onChange={(month) => setCurrentDate(currentDate.month(month))}
    style={{ width: 120, margin: "0 8px" }}
  >
    {monthsTH.map((monthName, index) => (
      <Option key={index} value={index}>
        {monthName}
      </Option>
    ))}
  </Select>

  {/* Dropdown เลือกปี */}
  <Select
    value={currentDate.year()}
    onChange={(year) => setCurrentDate(currentDate.year(year))}
    style={{ width: 100, marginRight: 8 }}
  >
    {years.map((year) => (
      <Option key={year} value={year}>
        {year}
      </Option>
    ))}
  </Select>

  {/* ปุ่มเลื่อนเดือน */}
  <button onClick={() => setCurrentDate(prev => prev.add(1, "month"))} className="calendar-nav-btn">
    <RightOutlined />
  </button>
</div>
          <div className="calendar-week-header">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className="calendar-week-day">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day, index) => {
              const isCurrentMonth = day.month() === currentDate.month();
              const isToday = day.isSame(today, "day");
              const isSelected = selectedDate?.isSame(day, "day");
              return (
                <div
                  key={index}
                  onClick={() =>
                    setSelectedDate(prev => (prev?.isSame(day, "day") ? null : day))
                  }
                  className={`calendar-day ${isCurrentMonth ? "current-month" : "not-current-month"} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                >
                  <span>{day.date()}</span>
                  {hasEvent(day) && isCurrentMonth && (
                    <div className="event-dot" style={{ backgroundColor: "#52c41a" }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="upcoming-events">
          <div className="events-header">
            <CalendarOutlined />
            <h4>{selectedDate ? `กิจกรรมวันที่ ${selectedDate.format("DD/MM/YYYY")}` : "กิจกรรมทั้งหมด"}</h4>
          </div>

          <div className="events-list">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <div key={index} className="event-item">
                  <div className="event-dot" style={{ backgroundColor: "#52c41a" }} />
                  <div>
                    <p className="event-title">{event.content}</p>
                    <p className="event-date">{dayjs(event.date).format("DD/MM/YYYY")}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-events">
                <div className="no-events-icon">
                  <CalendarOutlined />
                </div>
                <p>ไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentCalendarCard;
