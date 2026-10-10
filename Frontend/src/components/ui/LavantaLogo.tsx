import React, { useState } from 'react';
import lavantaLogoTransparent from '../../assets/lavantalogo-transparent.png';

export interface LavantaLogoProps {
  variant?: 'full' | 'mark' | 'white' | 'brand-image';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}

export const LavantaLogo: React.FC<LavantaLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText,
  style,
  imgStyle
}) => {
  const isBrandImage = variant === 'brand-image';
  const isFull = isBrandImage ? false : showText !== undefined ? showText : (variant === 'full' || variant === 'white');
  const isWhite = variant === 'white';
  const [imgError, setImgError] = useState(false);

  // Brand-Image dimensions when used directly as brand emblem/logo
  const brandImageDimensions = {
    xs: { width: 36, height: 36 },
    sm: { width: 52, height: 52 },
    md: { width: 80, height: 80 },
    lg: { width: 110, height: 110 },
    xl: { width: 150, height: 150 },
    '2xl': { width: 220, height: 220 }
  }[size] || { width: 80, height: 80 };

  // Mark/Icon dimensions based on size
  const markSize = size === 'xs' ? 28 : size === 'sm' ? 36 : size === 'lg' ? 48 : size === 'xl' ? 60 : size === '2xl' ? 80 : 40;

  // If standalone brand image variant
  if (isBrandImage) {
    return (
      <div
        className={`lavanta-brand-image-wrapper ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          overflow: 'visible',
          width: brandImageDimensions.width,
          height: brandImageDimensions.height,
          ...style
        }}
      >
        <img
          src={lavantaLogoTransparent || '/lavantalogo-transparent.png'}
          alt="Lavanta Naturals"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            filter: isWhite ? 'brightness(0) invert(1)' : undefined,
            ...imgStyle
          }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`lavanta-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'xs' ? '0.5rem' : size === 'sm' ? '0.65rem' : size === 'lg' ? '0.85rem' : size === 'xl' || size === '2xl' ? '1rem' : '0.75rem',
        textDecoration: 'none',
        userSelect: 'none',
        ...style
      }}
    >
      {/* Lavanta Logo Brand Icon */}
      <div
        className="lavanta-brand-icon"
        style={{
          width: markSize,
          height: markSize,
          minWidth: markSize,
          minHeight: markSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'transparent',
          boxSizing: 'border-box'
        }}
      >
        {!imgError ? (
          <img
            src={lavantaLogoTransparent || '/lavantalogo-transparent.png'}
            alt="Lavanta Naturals"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              filter: isWhite ? 'brightness(0) invert(1)' : undefined,
              ...imgStyle
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          /* Graceful botanical fallback if image fails to load */
          <svg
            width={markSize - 6}
            height={markSize - 6}
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="44" height="44" rx="10" fill="#EAF7E5" />
            <path d="M13 32C15 25 21 17 31 12" stroke="#69C43F" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M31 12C28 10 23 11 20 15C19 16 22 17 26 16C29 15.5 31 12 31 12Z" fill="#69C43F" />
            <path d="M24 19C20 18 16 20 15 24C16.5 24.5 19 23.5 22 21C23.5 19.5 24 19 24 19Z" fill="#4FAF32" />
          </svg>
        )}
      </div>

      {isFull && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: size === 'xs' ? '0.85rem' : size === 'sm' ? '0.95rem' : size === 'lg' ? '1.35rem' : size === 'xl' || size === '2xl' ? '1.6rem' : '1.1rem',
              color: isWhite ? '#FFFFFF' : 'var(--color-text-primary, #172235)',
              letterSpacing: '-0.02em'
            }}
          >
            Lavanta Naturals
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: size === 'xs' ? '0.55rem' : size === 'sm' ? '0.625rem' : size === 'lg' ? '0.75rem' : size === 'xl' || size === '2xl' ? '0.825rem' : '0.675rem',
              fontWeight: 600,
              color: isWhite ? '#EAF7E5' : 'var(--color-primary-deep, #3D8C24)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: '1px'
            }}
          >
            Workflow CRM
          </span>
        </div> 
      )}
    </div>
  );
};

