import { FC } from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Horizontal pipe */}
      <path
        d="M8 16h16"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Vertical pipe */}
      <path
        d="M16 8v16"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Connection points */}
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <circle cx="8" cy="16" r="2" fill="currentColor" />
      <circle cx="24" cy="16" r="2" fill="currentColor" />
      <circle cx="16" cy="8" r="2" fill="currentColor" />
      <circle cx="16" cy="24" r="2" fill="currentColor" />
    </svg>
  );
};