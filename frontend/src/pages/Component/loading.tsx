import React from "react";
import { Grid } from 'antd';
import "./CoopMatchLoader.css";
import logo from '../../assets/Co-op match-Logo.png'

export type AnimationType =
  | "puzzle-fold"
  | "piece-rotate"
  | "flip-3d"
  | "wave-fold"
  | "bounce-assemble";

export type LoaderSize = "sm" | "md" | "lg";
export type ProgressMode = "none" | "indeterminate" | "determinate";

export interface CoopMatchLoaderProps {
  /** เลือกสไตล์แอนิเมชัน */
  animation?: AnimationType;
  /** ขนาดตัวโลโก้/ตัวอักษร */
  size?: LoaderSize;
  /** โชว์ข้อความสถานะ */
  showText?: boolean;
  /** ข้อความสถานะ (ค่าเริ่มต้น: "กำลังจับคู่สหกิจศึกษา...") */
  text?: string;
  /** โหมดแถบความคืบหน้า */
  progressMode?: ProgressMode;
  /** ค่าเปอร์เซ็นต์ 0–100 (ใช้เมื่อ progressMode = "determinate") */
  progress?: number;
  /** แสดงเป็นโอเวอร์เลย์เต็มจอ */
  overlay?: boolean;
  /** ใช้รูปโลโก้ PNG/JPG ของคุณแทนชิ้นพัซเซิล */
  logoSrc?: string;
  /** เปลี่ยนสีหลักของแบรนด์ (เช่น "#0ea5e9") */
  primaryColor?: string;
  /** ความเร็วแอนิเมชัน (วินาที) เช่น 2.5 */
  speed?: number;
  /** คลาสเสริม */
  className?: string;
  /** สไตล์เสริม */
  style?: React.CSSProperties;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const { useBreakpoint } = Grid;

const CoopMatchLoader: React.FC<CoopMatchLoaderProps> = ({
  animation = "puzzle-fold",
  size = "md",
  showText = true,
  text = "Loading . . . .",
  progressMode = "indeterminate",
  progress = 0,
  overlay = false,
  logoSrc,
  primaryColor,
  speed,
  className,
  style,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  
  // Auto-adjust size based on screen size if not explicitly set
  const responsiveSize = (() => {
    if (size !== "md") return size; // Respect explicit size setting
    if (isMobile) return "sm";
    if (isTablet) return "md";
    return "lg";
  })();

  const rootVars: React.CSSProperties = {
    ...(primaryColor ? ({ ["--cml-primary" as any]: primaryColor } as React.CSSProperties) : {}),
    ...(speed ? ({ ["--cml-speed" as any]: `${speed}s` } as React.CSSProperties) : {}),
    ...style,
  };

  const pct = clamp(progress ?? 0, 0, 100);

  return (
    <div
      className={[
        "cml-root",
        "cml-responsive",
        overlay ? "cml-overlay" : "",
        `cml-size-${responsiveSize}`,
        isMobile ? "cml-mobile" : "",
        isTablet ? "cml-tablet" : "",
        className || "",
      ].join(" ").trim()}
      style={rootVars}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className={`cml-logo-wrapper ${animation}`}>
        <div className="cml-piece">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="cml-logo-image" aria-hidden="true" />
          ) : (
             <img src={logo} alt="" className="cml-logo-image" aria-hidden="true" />
          )}
        </div>

        <div className="cml-text-part">
          <div className="cml-brand-text">
            <span className="cml-coop">Co-op</span>
            <span className="cml-match">Match</span>
          </div>
        </div>
      </div>

      {showText && <p className="cml-status">{text}</p>}
        {progressMode !== "none" && (
        <div className="cml-progress" >
            <div className={`cml-bar ${progressMode === "determinate" ? "is-determinate" : ""}`}>
            <div
                className="cml-fill"
                style={progressMode === "determinate" ? ({ ['--cml-pct' as any]: pct / 100 }) : undefined}
                aria-hidden={progressMode !== "determinate" ? true : undefined}
            />
            </div>
            {progressMode === "determinate" && (
            <div className="cml-percent" aria-label={`${pct}%`}>{pct}%</div>
            )}
        </div>
        )}

    </div>
  );
};

export default CoopMatchLoader;
