import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  to?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  subtitle,
  trend,
  to,
  delay = 0
}) => {
  const navigate = useNavigate();
  const [displayValue, setDisplayValue] = useState<number | string>(() => {
    return typeof value === 'number' ? 0 : value;
  });

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 800; // ms
      const steps = 30;
      const stepTime = duration / steps;
      const increment = (end - start) / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const handleClick = () => {
    if (to) navigate(to);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      onClick={handleClick}
      className="stat-card leaf-watermark"
      style={{ cursor: to ? 'pointer' : 'default' }}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>

      <div className="stat-card-value">
        {prefix}
        {displayValue}
        {suffix}
      </div>

      <div className="stat-card-footer">
        {trend && (
          <span
            style={{
              color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
        {subtitle && <span>{subtitle}</span>}
      </div>
    </motion.div>
  );
};
