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
      {/* Main horizontal pipe */}
      <path
        d="M4 12h16a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vertical pipe section */}
      <path
        d="M4 8v16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Connection joint */}
      <circle
        cx="4"
        cy="20"
        r="2"
        fill="currentColor"
      />
    </svg>
  );
};