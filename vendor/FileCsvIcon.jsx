// CSV file-type icon — a colored document glyph with a green "CSV" badge, matching the
// Untitled UI file-type icon used in Figma (node 4074-152400). Colored artwork (not a
// monochrome currentColor glyph), so it lives on its own like the brand logos in logos.jsx.
import React from 'react';

export function FileCsvIcon({ size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Page body with a dog-eared top-right corner */}
      <path
        d="M6 1H12L16 5V18C16 18.5523 15.5523 19 15 19H6C5.44772 19 5 18.5523 5 18V2C5 1.44772 5.44772 1 6 1Z"
        fill="white"
        stroke="#D0D5DD"
        strokeWidth="1"
      />
      <path d="M12 1L16 5H13C12.4477 5 12 4.5523 12 4V1Z" fill="#EAECF0" />
      {/* Green format badge */}
      <rect x="1.5" y="9.5" width="10" height="7" rx="1.5" fill="#099250" />
      <text
        x="6.5"
        y="14.6"
        textAnchor="middle"
        fontFamily="'Segoe UI Variable', 'Segoe UI', sans-serif"
        fontSize="4"
        fontWeight="700"
        letterSpacing="-0.2"
        fill="white"
      >
        CSV
      </text>
    </svg>
  );
}
