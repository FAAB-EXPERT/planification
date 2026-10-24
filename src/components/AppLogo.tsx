import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-16 h-16',
  alt = 'Logo Officiel FAAB PLAN'
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [
    './logo.png',
    './assets/aistudio/logo_de_Faab_Plan_aa9d6e11.png'
  ];

  if (srcIndex < sources.length) {
    return (
      <img
        src={sources[srcIndex]}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setSrcIndex(prev => prev + 1)}
        className={`${className} object-contain shrink-0 select-none drop-shadow-md`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      fill="none"
      className={`${className} shrink-0 select-none drop-shadow-md`}
      role="img"
      aria-label={alt}
    >
      <rect x="28" y="42" width="184" height="170" rx="28" fill="#1e3a5f" stroke="#90D5FF" strokeWidth="8" />
      <rect x="44" y="84" width="152" height="112" rx="16" fill="#FFFFFF" />
      <rect x="68" y="22" width="22" height="38" rx="10" fill="#1e3a5f" stroke="#90D5FF" strokeWidth="4" />
      <rect x="150" y="22" width="22" height="38" rx="10" fill="#1e3a5f" stroke="#90D5FF" strokeWidth="4" />
      <text
        x="120"
        y="128"
        fontFamily="Plus Jakarta Sans, Arial, sans-serif"
        fontSize="30"
        fontWeight="900"
        fill="#1e3a5f"
        textAnchor="middle"
      >
        F-PLAN
      </text>
      <path
        d="M104 166 L118 180 L152 144"
        stroke="#0284c7"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
