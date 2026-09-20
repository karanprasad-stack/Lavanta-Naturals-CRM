import React from 'react';

interface LavantaLogoProps {
  variant?: 'full' | 'mark' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LavantaLogo: React.FC<LavantaLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = ''
}) => {
  const isFull = variant === 'full' || variant === 'white';
  const isWhite = variant === 'white';

  const markSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  return (
    <div
      className={`lavanta-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      {/* Botanical Lavanta Logo Emblem SVG */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="44" height="44" rx="10" fill={isWhite ? 'rgba(255,255,255,0.15)' : '#EAF7E5'} />
        {/* Main botanical stem */}
        <path
          d="M13 32C15 25 21 17 31 12"
          stroke="#69C43F"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Upper leaf */}
        <path
          d="M31 12C28 10 23 11 20 15C19 16 22 17 26 16C29 15.5 31 12 31 12Z"
          fill="#69C43F"
        />
        {/* Side leaf */}
        <path
          d="M24 19C20 18 16 20 15 24C16.5 24.5 19 23.5 22 21C23.5 19.5 24 19 24 19Z"
          fill="#4FAF32"
        />
        {/* Delicate lavender botanical bud */}
        <circle cx="31.5" cy="11.5" r="2.5" fill="#C29DFF" />
        <circle cx="28" cy="8.5" r="2" fill="#E8D8FF" />
      </svg>

      {isFull && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: size === 'sm' ? '0.95rem' : size === 'lg' ? '1.35rem' : '1.1rem',
              color: isWhite ? '#FFFFFF' : '#172235',
              letterSpacing: '-0.02em'
            }}
          >
            Lavanta Naturals
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: size === 'sm' ? '0.625rem' : size === 'lg' ? '0.75rem' : '0.675rem',
              fontWeight: 600,
              color: isWhite ? '#EAF7E5' : '#69C43F',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            Clean Skincare HQ
          </span>
        </div>
      )}
    </div>
  );
};
