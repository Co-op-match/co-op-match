import React, { useEffect, useMemo, useState } from "react";
import { Card, Space, Tag, Checkbox, Empty, Skeleton, Segmented, DatePicker, Button, Divider } from "antd";
import { DownloadOutlined, CalendarOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";
import { getTrend } from "../../../services/https";
import dayjs, { Dayjs } from "dayjs";
import { TrendingUpIcon } from "lucide-react";

type TrendPoint = {
  date: string; // YYYY-MM-DD
  total: number; // จำนวนผู้สมัครรวม/วัน
  pass: number; // ผ่าน/วัน
  fail: number; // ไม่ผ่าน (รวม ไม่ได้รับเลือก)/วัน
};

type Props = {
  companyId: number;
  defaultDays?: number; // ค่าเริ่มต้นเมื่อยังไม่เลือกช่วงเอง (เช่น 30)
  height?: number;
  title?: string; 
};

const { RangePicker } = DatePicker;

const TOTAL_KEY = "จำนวนการสมัคร";
const PASS_KEY = "ผ่าน";
const FAIL_KEY = "ไม่ผ่าน";

const COLOR_TOTAL = "#1677ff";
const COLOR_PASS = "#52c41a";
const COLOR_FAIL = "#ff4d4f";

// Presets สำหรับเลือกช่วงเวลา
const PRESETS = [
  { label: "7 วัน", value: "7d" },
  { label: "14 วัน", value: "14d" },
  { label: "30 วัน", value: "30d" },
  { label: "90 วัน", value: "90d" },
  { label: "เดือนนี้", value: "thisMonth" },
  { label: "เดือนก่อน", value: "lastMonth" },
  { label: "กำหนดเอง", value: "custom" },
] as const;
type PresetValue = (typeof PRESETS)[number]["value"];

const TrendApplicantsArea: React.FC<Props> = ({
  companyId,
  defaultDays = 30,
  title = "แนวโน้มผู้สมัคร (รายวัน)",
}) => {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<TrendPoint[]>([]);
  const [selected, setSelected] = useState<string[]>([
    TOTAL_KEY,
    PASS_KEY,
    FAIL_KEY,
  ]);
  const [showFilters, setShowFilters] = useState(false);

  // ====== ตัวเลือกช่วงเวลา (อยู่ในคอมโพเนนต์นี้) ======
  const [preset, setPreset] = useState<PresetValue>("30d");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // แปลง preset -> พารามิเตอร์สำหรับ API
  const currentRangeStrings = useMemo(() => {
    let s: string | undefined;
    let e: string | undefined;
    let dParam: number | undefined;

    const fmt = (d: Dayjs) => d.format("YYYY-MM-DD");

    if (preset === "custom") {
      if (range && range[0] && range[1]) {
        s = fmt(range[0]);
        e = fmt(range[1]);
      } else {
        // ยังไม่เลือกครบ ไม่ยิง API
      }
    } else if (preset === "thisMonth") {
      const start = dayjs().startOf("month");
      const end = dayjs().endOf("month");
      s = fmt(start);
      e = fmt(end);
    } else if (preset === "lastMonth") {
      const start = dayjs().subtract(1, "month").startOf("month");
      const end = dayjs().subtract(1, "month").endOf("month");
      s = fmt(start);
      e = fmt(end);
    } else {
      // แบบย้อนหลัง X วัน
      const n = parseInt(preset, 10);
      dParam = Number.isFinite(n) ? n : defaultDays;
    }

    return { start: s, end: e, days: dParam };
  }, [preset, range, defaultDays]);

  // ดึงข้อมูลตามช่วงเวลา (เลือกได้ในการ์ดนี้)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (preset === "custom" && !(range && range[0] && range[1])) return;

        setLoading(true);
        const { start, end, days } = currentRangeStrings;
        const data = await getTrend(companyId, start, end, days ?? defaultDays);

        if (!alive) return;

        // ✅ Normalize เป็น TrendPoint[]
        const normalized: TrendPoint[] = (Array.isArray(data) ? data : []).map(
          (d: any) => ({
            date: d.date,
            total: d.total ?? d.value ?? 0,
            pass: d.pass ?? 0,
            fail: d.fail ?? 0,
          })
        );

        setRaw(normalized); // 👈 แทนที่จะ setRaw(data)
      } catch (e) {
        console.error("getTrend error:", e);
        if (alive) setRaw([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [companyId, preset, range, currentRangeStrings, defaultDays]);

  // label ช่วงเวลาโชว์ใต้หัวการ์ด
  const fmtTH = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const periodLabel = useMemo(() => {
    const { start, end, days } = currentRangeStrings;
    if (start && end) return `${fmtTH(start)} – ${fmtTH(end)}`;
    if (raw.length > 0)
      return `${fmtTH(raw[0].date)} – ${fmtTH(raw[raw.length - 1].date)}`;
    return `ย้อนหลัง ${days ?? defaultDays} วัน`;
  }, [currentRangeStrings, raw, defaultDays]);

  // map เป็นคอลัมน์ที่กราฟใช้
  const chartData = useMemo(() => {
    return (raw ?? []).map((d) => ({
      date: d.date,
      [TOTAL_KEY]: d.total ?? 0,
      [PASS_KEY]: d.pass ?? 0,
      [FAIL_KEY]: d.fail ?? 0,
    }));
  }, [raw]);

  // จำนวนการสมัคร
  const periodTotals = useMemo(() => {
    let total = 0,
      pass = 0,
      fail = 0;
    chartData.forEach((r) => {
      total += r[TOTAL_KEY] ?? 0;
      pass += r[PASS_KEY] ?? 0;
      fail += r[FAIL_KEY] ?? 0;
    });
    const rate = total > 0 ? (pass / total) * 100 : 0;
    return { total, pass, fail, rate };
  }, [chartData]);

  // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
  const changePercent = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0][TOTAL_KEY];
    const last = chartData[chartData.length - 1][TOTAL_KEY];
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [chartData]);

  // Tooltip กำหนดเอง
  const TooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const byKey: Record<string, number> = {};
    payload.forEach(
      (p: any) => (byKey[p.dataKey as string] = Number(p.value) || 0)
    );
    const total =
      byKey[TOTAL_KEY] ?? (byKey[PASS_KEY] ?? 0) + (byKey[FAIL_KEY] ?? 0);
    const pct = (n: number) =>
      total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

    return (
      <div
        style={{
          background: "rgba(255,255,255,0.98)",
          border: "1px solid #e8e8e8",
          borderRadius: 16,
          padding: "16px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          minWidth: 260,
          fontSize: 14,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 10,
            color: "#1f1f1f",
            fontSize: 15,
          }}
        >
          📅{" "}
          {new Date(`${label}T00:00:00`).toLocaleDateString("th-TH", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>

        {selected.includes(TOTAL_KEY) && (
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: COLOR_TOTAL,
                  marginRight: 10,
                }}
              />
              <span>{TOTAL_KEY}</span>
            </div>
            <b style={{ color: COLOR_TOTAL, fontSize: 15 }}>
              {total.toLocaleString("th-TH")}
            </b>
          </div>
        )}

        <Divider style={{ margin: "10px 0" }} />

        {selected.includes(PASS_KEY) && (
          <div
            style={{
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: COLOR_PASS,
                  marginRight: 10,
                }}
              />
              <span>{PASS_KEY}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <b style={{ color: COLOR_PASS, fontSize: 14 }}>
                {(byKey[PASS_KEY] ?? 0).toLocaleString("th-TH")}
              </b>
              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                ({pct(byKey[PASS_KEY] ?? 0)}%)
              </div>
            </div>
          </div>
        )}
        {selected.includes(FAIL_KEY) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: COLOR_FAIL,
                  marginRight: 10,
                }}
              />
              <span>{FAIL_KEY}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <b style={{ color: COLOR_FAIL, fontSize: 14 }}>
                {(byKey[FAIL_KEY] ?? 0).toLocaleString("th-TH")}
              </b>
              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                ({pct(byKey[FAIL_KEY] ?? 0)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // CSV export
  // บังคับ Excel อ่าน date เป็น "Text" ด้วยการใส่ ' นำหน้า
  // และใส่ BOM เพื่อความเข้ากันได้กับ Excel/ภาษาไทย
  const downloadCSV = () => {
    const header = ["date", "pass", "fail", "total"];

    const rows = raw.map((r) => {
      const excelTextDate = `'${r.date}`; // ← ทำให้ Excel ไม่แปลงเป็น Date/Number จึงไม่ขึ้น #####
      return [excelTextDate, r.pass ?? 0, r.fail ?? 0, r.total ?? 0];
    });

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // ใส่ BOM นำหน้า
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applicants_trend.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradId = (key: string) => `grad-${key.replace(/\s/g, "-")}`;

  return (
    <Card
      loading={loading}
      className="chart-card"
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Space>
              <div
                style={{
                  background: "linear-gradient(135deg, #1677ff, #69c0ff)",
                  borderRadius: 10,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <TrendingUpIcon style={{ color: "#fff", fontSize: 16 }} />
              </div>
              <div>
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: "#1f1f1f" }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#8c8c8c",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <CalendarOutlined />
                  <span>{periodLabel}</span>
                  {changePercent !== 0 && (
                    <Tag
                      color={changePercent > 0 ? "success" : "error"}
                      style={{ marginLeft: 8, borderRadius: 12, fontSize: 11 }}
                    >
                      {changePercent > 0 ? "+" : ""}
                      {changePercent.toFixed(1)}%
                    </Tag>
                  )}
                </div>
              </div>
            </Space>
          </div>
        </div>
      }
      extra={
        <Space size="small" wrap>
          <Button
            type={showFilters ? "primary" : "default"}
            size="small"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            style={{ borderRadius: 8 }}
          >
            ตัวกรอง
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={downloadCSV}
            style={{ borderRadius: 8 }}
          >
            Export
          </Button>
        </Space>
      }
      style={{
        borderRadius: 20,
        boxShadow: "0 6px 40px rgba(0,0,0,0.06)",
        border: "1px solid #f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* สถิติรวม - ปรับปรุงให้สวยขึ้น */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <div
          style={{
            background: "linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%)",
            borderRadius: 16,
            padding: "5px 24px",
            marginBottom: 20,
            border: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 20,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 6 }}>
                จำนวนการสมัคร
              </div>
              <div
                style={{ fontSize: 24, fontWeight: 700, color: COLOR_TOTAL }}
              >
                {periodTotals.total.toLocaleString("th-TH")}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 6 }}>
                ผ่าน
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLOR_PASS }}>
                {periodTotals.pass.toLocaleString("th-TH")}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 6 }}>
                ไม่ผ่าน
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLOR_FAIL }}>
                {periodTotals.fail.toLocaleString("th-TH")}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 6 }}>
                อัตราผ่าน
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#722ed1" }}>
                {periodTotals.rate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ส่วนควบคุม - แสดงเมื่อกด Filter */}
      {showFilters && (
        <div
          style={{
            background: "#fafbfc",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 20,
            border: "1px solid #f0f0f0",
          }}
        >
          {/* เลือกช่วงเวลา */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              📅 เลือกช่วงเวลา
            </div>
            <Space wrap>
              <Segmented<PresetValue>
                options={PRESETS as any}
                value={preset}
                onChange={(val) => {
                  setPreset(val as PresetValue);
                  if (val !== "custom") setRange(null);
                }}
                style={{ borderRadius: 8 }}
              />
              {preset === "custom" && (
                <RangePicker
                  value={range ?? undefined}
                  onChange={(vals) =>
                    setRange(vals ? [vals[0]!, vals[1]!] : null)
                  }
                  format="YYYY-MM-DD"
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              )}
            </Space>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          {/* เลือกข้อมูลที่แสดง */}
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              <EyeOutlined /> ข้อมูลที่แสดงในกราฟ
            </div>
            <Checkbox.Group
              options={[
                {
                  label: (
                    <span>
                      <span style={{ color: COLOR_TOTAL }}>●</span> {TOTAL_KEY}
                    </span>
                  ),
                  value: TOTAL_KEY,
                },
                {
                  label: (
                    <span>
                      <span style={{ color: COLOR_PASS }}>●</span> {PASS_KEY}
                    </span>
                  ),
                  value: PASS_KEY,
                },
                {
                  label: (
                    <span>
                      <span style={{ color: COLOR_FAIL }}>●</span> {FAIL_KEY}
                    </span>
                  ),
                  value: FAIL_KEY,
                },
              ]}
              value={selected}
              onChange={(vals) => setSelected(vals as string[])}
              style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}
            />
          </div>
        </div>
      )}

      {/* กราฟ */}
      <div style={{ height: "330px", padding: "8px 0" }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : chartData.length === 0 ? (
          <Empty
            description="ยังไม่มีข้อมูลในช่วงเวลานี้"
            style={{ padding: "48px 0" }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                stroke="#f0f0f0"
                horizontal
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#666" }}
                axisLine={{ stroke: "#e8e8e8" }}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(`${value}T00:00:00`);
                  return date.toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                  });
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#666" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.toLocaleString("th-TH")}
              />
              <RTooltip content={<TooltipContent />} />

              {/* gradients */}
              <defs>
                <linearGradient
                  id={gradId(TOTAL_KEY)}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={COLOR_TOTAL} stopOpacity={0.4} />
                  <stop
                    offset="100%"
                    stopColor={COLOR_TOTAL}
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id={gradId(PASS_KEY)}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={COLOR_PASS} stopOpacity={0.4} />
                  <stop
                    offset="100%"
                    stopColor={COLOR_PASS}
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id={gradId(FAIL_KEY)}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={COLOR_FAIL} stopOpacity={0.4} />
                  <stop
                    offset="100%"
                    stopColor={COLOR_FAIL}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>

              {/* Areas: ไม่มี dot ปกติ (activeDot เฉพาะ hover) */}
              {selected.includes(PASS_KEY) && (
                <Area
                  type="monotone"
                  dataKey={PASS_KEY}
                  name={PASS_KEY}
                  stroke={COLOR_PASS}
                  strokeWidth={2.5}
                  fill={`url(#${gradId(PASS_KEY)})`}
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: COLOR_PASS,
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  isAnimationActive={false}
                />
              )}
              {selected.includes(FAIL_KEY) && (
                <Area
                  type="monotone"
                  dataKey={FAIL_KEY}
                  name={FAIL_KEY}
                  stroke={COLOR_FAIL}
                  strokeWidth={2.5}
                  fill={`url(#${gradId(FAIL_KEY)})`}
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: COLOR_FAIL,
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  isAnimationActive={false}
                />
              )}
              {selected.includes(TOTAL_KEY) && (
                <Area
                  type="monotone"
                  dataKey={TOTAL_KEY}
                  name={TOTAL_KEY}
                  stroke={COLOR_TOTAL}
                  strokeWidth={3}
                  fill={`url(#${gradId(TOTAL_KEY)})`}
                  dot={false}
                  activeDot={{
                    r: 7,
                    stroke: COLOR_TOTAL,
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default TrendApplicantsArea;
