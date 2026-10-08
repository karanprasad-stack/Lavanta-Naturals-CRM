import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles, Building2, ShieldCheck, Info } from 'lucide-react';
import { FestivalCalendarEntry } from '../../types/calendar';

interface FestivalDetailModalProps {
  festival: FestivalCalendarEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FestivalDetailModal: React.FC<FestivalDetailModalProps> = ({
  festival,
  isOpen,
  onClose
}) => {
  if (!isOpen || !festival) return null;

  const fDate = new Date(festival.startDateTime);
  const formattedDate = fDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getHolidayLabel = () => {
    if (festival.isHoliday) {
      return {
        title: 'Company Holiday',
        subtitle: 'Official day off — offices and operations are closed',
        badgeBg: '#DCFCE7',
        badgeColor: '#166534',
        badgeBorder: '#BBF7D0'
      };
    }
    return {
      title: 'Observational Festival',
      subtitle: 'Cultural celebration — standard work schedule applies',
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      badgeBorder: '#FDE68A'
    };
  };

  const holidayInfo = getHolidayLabel();

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '460px',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  fontSize: '1.75rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  border: '1px solid #FDE68A'
                }}
              >
                {festival.icon || '🪔'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#B45309'
                    }}
                  >
                    Festival / Holiday
                  </span>
                  <Sparkles size={11} color="#F59E0B" />
                </div>
                <h3
                  style={{
                    margin: '2px 0 0',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#78350F',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {festival.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '5px',
                cursor: 'pointer',
                color: '#78350F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Date Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}
            >
              <Calendar size={18} color="var(--color-primary-deep)" />
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Observance Date
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {formattedDate}
                </div>
              </div>
            </div>

            {/* Holiday Status Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: holidayInfo.badgeBg,
                borderRadius: '10px',
                border: `1px solid ${holidayInfo.badgeBorder}`
              }}
            >
              <Building2 size={18} color={holidayInfo.badgeColor} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: holidayInfo.badgeColor }}>
                  {holidayInfo.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: holidayInfo.badgeColor, opacity: 0.9, marginTop: '2px' }}>
                  {holidayInfo.subtitle}
                </div>
              </div>
            </div>

            {/* Description */}
            {festival.description && (
              <div
                style={{
                  fontSize: '0.825rem',
                  lineHeight: 1.5,
                  color: 'var(--color-text-secondary)',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: '0.75rem' }}>
                  <Info size={13} />
                  About This Festival
                </div>
                {festival.description}
              </div>
            )}

            {/* Read-Only Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.725rem',
                color: 'var(--color-text-muted)',
                paddingTop: '0.25rem'
              }}
            >
              <ShieldCheck size={14} color="#16A34A" />
              <span>Official Indian holiday & festival records are verified and read-only.</span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                color: 'var(--color-text-primary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
