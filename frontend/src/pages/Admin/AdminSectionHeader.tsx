// AdminSectionHeader.tsx
import { Typography, Grid } from "antd";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;             // ปุ่ม/เมนูด้านขวา
  gradientFrom?: string;
  gradientTo?: string;
};

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function AdminSectionHeader({
  icon,
  title,
  subtitle,
  actions,
  gradientFrom = "rgb(30,58,138)",
  gradientTo = "rgb(59,130,246)",
}: Props) {
  const screens = useBreakpoint();
  const stacked = !screens.sm;     // จอ < 576px ให้ซ้อนบรรทัด

  return (
    <div className="adminhdr" style={{
      background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
      borderRadius: 20, overflow: "hidden",
      marginBottom: 32,
    }}>
      <style>{css}</style>

      <div className="adminhdr__content">
        <div className="adminhdr__row">
          {icon && <div className="adminhdr__icon">{icon}</div>}

          <div className="adminhdr__text">
            <Title level={2} className="adminhdr__title">{title}</Title>
            {subtitle && <Text className="adminhdr__subtitle">{subtitle}</Text>}
          </div>

          {!stacked && actions && (
            <div className="adminhdr__actions">{actions}</div>
          )}
        </div>

        {stacked && actions && (
          <div className="adminhdr__actions adminhdr__actions--stacked">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
.adminhdr__content{ padding:16px }
@media(min-width:576px){ .adminhdr__content{ padding:24px } }

.adminhdr__row{
  display:flex; align-items:center; gap:16px; min-width:0; /* สำคัญ: ให้ลูกบีบได้ */
  flex-wrap:nowrap;
}
.adminhdr__icon{
  flex:0 0 auto; width:56px; height:56px; border-radius:16px;
  background:rgba(255,255,255,.22); display:flex; align-items:center; justify-content:center;
}
.adminhdr__text{
  flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:6px;
  word-break: break-word;
}
.adminhdr__title{
  margin:0 !important; color:#fff !important; line-height:1.12;
  font-weight:800 !important;
  font-size: clamp(20px, 5.6vw, 32px) !important; /* หด/ขยายอัตโนมัติ */
}
.adminhdr__subtitle{
  margin:0 !important; color:#fff !important; opacity:.95;
  font-size: clamp(13px, 3.8vw, 16px) !important;
}
.adminhdr__actions{ margin-left:auto; display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
.adminhdr__actions > *{ max-width:100%; }

@media(max-width:575.98px){
  .adminhdr__row{ align-items:flex-start; }
  .adminhdr__icon{ width:48px; height:48px; border-radius:12px; }
  .adminhdr__actions--stacked{
    width:100%; margin-top:12px; justify-content:flex-start;
  }
}
`;