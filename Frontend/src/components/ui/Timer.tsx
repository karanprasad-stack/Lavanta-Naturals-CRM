import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from './Button';

interface TimerProps {
  initialSeconds?: number;
  isRunning?: boolean;
  onTimeUpdate?: (seconds: number, running: boolean) => void;
  onComplete?: (totalSeconds: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds = 0,
  isRunning = false,
  onTimeUpdate,
  onComplete
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [active, setActive] = useState(isRunning);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (active) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (onTimeUpdate) onTimeUpdate(next, true);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [active, onTimeUpdate]);

  const handleStart = () => {
    setActive(true);
    if (onTimeUpdate) onTimeUpdate(seconds, true);
  };

  const handlePause = () => {
    setActive(false);
    if (onTimeUpdate) onTimeUpdate(seconds, false);
  };

  const handleReset = () => {
    setActive(false);
    setSeconds(0);
    if (onTimeUpdate) onTimeUpdate(0, false);
  };

  const handleComplete = () => {
    setActive(false);
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#284B3A', '#8FAF99', '#B69A62', '#DCE8DF']
    });
    if (onComplete) onComplete(seconds);
  };

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="luxury-card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--bg-surface-elevated)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: active ? 'rgba(100, 140, 107, 0.15)' : 'var(--color-soft-sage)',
            color: active ? 'var(--color-success)' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Clock size={20} className={active ? 'pulse' : ''} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Task Focus Timer
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
              letterSpacing: '0.04em'
            }}
          >
            {formatTime(seconds)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!active ? (
          <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={handleStart}>
            {seconds > 0 ? 'Resume Task' : 'Start Task'}
          </Button>
        ) : (
          <Button variant="outline" size="sm" icon={<Pause size={14} />} onClick={handlePause}>
            Pause Task
          </Button>
        )}

        {seconds > 0 && (
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={handleReset} title="Reset">
            Reset
          </Button>
        )}

        <Button
          variant="gold"
          size="sm"
          icon={<CheckCircle2 size={14} />}
          onClick={handleComplete}
        >
          Complete Task
        </Button>
      </div>
    </div>
  );
};
