import { LucideIcon } from "lucide-react";
import React from "react";

interface SecondaryButtonProps {
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  icon: Icon,
  isActive = false,
  onClick,
}) => {
  const mainColor = "#035DF9";
  const borderColor = isActive ? mainColor : "#E9EBED";
  const bgColor = isActive ? mainColor : "white";
  const contentColor = isActive ? "white" : mainColor;

  return (
    <button
      onClick={onClick}
      className="flex items-center transition-all active:scale-95 cursor-pointer shrink-0 h-[29px]"
      dir="rtl"
    >
      {/* الجزء الأيمن (الأيقونة) - بناءً على الـ SVG المرسل */}
      <div className="h-full relative flex items-center shrink-0">
        <svg
          width="28"
          height="29"
          viewBox="88.5 0 28 29"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto"
        >
          <path
            d="M102.5 0.5H93.1172C90.5673 0.500248 88.5002 2.5673 88.5 5.11719V23.8828C88.5002 26.4327 90.5673 28.4998 93.1172 28.5H102.5C110.232 28.5 116.5 22.232 116.5 14.5C116.5 6.76801 110.232 0.5 102.5 0.5Z"
            fill={bgColor}
            stroke={borderColor}
            strokeWidth="1"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pl-[2px]">
          <Icon size={16} style={{ color: contentColor }} strokeWidth={2.5} />
        </div>
      </div>

      {/* الجزء الأيسر (النص) - بناءً على الـ SVG المرسل (المستطيل المرن) */}
      <div className="h-full flex items-center -mr-[1px] shrink-0">
        <div
          className="h-[28px] flex items-center px-4 border rounded-[5.5px]"
          style={{
            backgroundColor: bgColor,
            borderColor: borderColor,
          }}
        >
          <span
            className="font-bold text-[13px] whitespace-nowrap transition-colors"
            style={{ color: contentColor }}
          >
            {label}
          </span>
        </div>
      </div>
    </button>
  );
};
