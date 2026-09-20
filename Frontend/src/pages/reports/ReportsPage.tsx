import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Boxes, CheckSquare, Receipt, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('q3-2026');
  const [reportModule, setReportModule] = useState<'all' | 'sales' | 'inventory' | 'tasks' | 'expenses'>('all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)' }}>
            Consolidated Analytics & Reports
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Cross-module intelligence across sales channels, task velocity, formulation costs, and inventory
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="q3-2026">Q3 2026 (Current Quarter)</option>
            <option value="last-30">Last 30 Days</option>
            <option value="year-2026">Full Year 2026 YTD</option>
          </select>

          <Button
            variant="outline"
            icon={<Download size={15} />}
            onClick={() => showToast('Exporting executive report CSV & PDF summary...', 'success')}
          >
            Export Dossier
          </Button>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="luxury-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Modules' },
          { id: 'sales', label: 'Sales & Channels' },
          { id: 'inventory', label: 'Inventory Health' },
          { id: 'tasks', label: 'Task Velocity' },
          { id: 'expenses', label: 'COGS & Expenses' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportModule(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: reportModule === tab.id ? 'var(--color-primary)' : 'var(--border-color)',
              background: reportModule === tab.id ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: reportModule === tab.id ? 'var(--color-warm-white)' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts & Metric Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Sales & Revenue Trend Chart */}
        {(reportModule === 'all' || reportModule === 'sales') && (
          <div className="luxury-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>Monthly Gross D2C Revenue</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Jul - Sep 2026 (₹ in Lakhs)</span>
              </div>
              <Badge variant="success">+28.4% YoY</Badge>
            </div>

            {/* Visual Bar Chart in Lavanta Colors */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', paddingTop: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              {[
                { month: 'Jul', val: 65, amount: '₹1.85L' },
                { month: 'Aug', val: 82, amount: '₹2.40L' },
                { month: 'Sep (P)', val: 96, amount: '₹3.10L' }
              ].map(bar => (
                <div key={bar.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '60px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{bar.amount}</span>
                  <div
                    style={{
                      width: '38px',
                      height: `${bar.val * 1.4}px`,
                      background: 'linear-gradient(to top, var(--color-deep-forest), var(--color-sage))',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{bar.month}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Q3 Revenue: <strong>₹7,35,000</strong></span>
              <span>Repeat Buyers: <strong>41.2%</strong></span>
            </div>
          </div>
        )}

        {/* COGS vs Operating Margins */}
        {(reportModule === 'all' || reportModule === 'expenses') && (
          <div className="luxury-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>Expense & Margin Distribution</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Cost of goods vs gross margin</span>
              </div>
              <Badge variant="gold">Healthy 74% Margin</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Active Botanical Raw Ingredients', percent: 14, color: 'var(--color-primary)' },
                { label: 'Amber Bottles & Eco-Packaging', percent: 8, color: 'var(--color-sage)' },
                { label: 'Cleanroom Formulation & Testing', percent: 4, color: 'var(--color-muted-gold)' },
                { label: 'Gross Operating Margin', percent: 74, color: 'var(--color-success)' }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700 }}>{item.percent}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.percent}%`, height: '100%', background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Productivity & SLA Compliance */}
        {(reportModule === 'all' || reportModule === 'tasks') && (
          <div className="luxury-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>Team Task SLA Compliance</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>On-time task resolution rate</span>
              </div>
              <Badge variant="forest">92% Compliance</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { squad: 'Product & Formulation Lab', rate: 96, count: '14 tasks completed' },
                { squad: 'Growth & Brand Marketing', rate: 94, count: '22 tasks completed' },
                { squad: 'Operations & Supply Chain', rate: 88, count: '18 tasks completed' },
                { squad: 'Salon & Boutique Sales', rate: 90, count: '10 tasks completed' }
              ].map(s => (
                <div key={s.squad} style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>
                    <span>{s.squad}</span>
                    <span style={{ color: 'var(--color-primary)' }}>{s.rate}%</span>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Turnover & Cold-Chain SLA */}
        {(reportModule === 'all' || reportModule === 'inventory') && (
          <div className="luxury-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>Warehouse & Cold-Chain Turnover</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Average stock cycle duration</span>
              </div>
              <Badge variant="sage">28 Days Cycle</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Stockout Events</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
                  1
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Dropper bottles</span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Batch Dispatch SLA</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                  99.1%
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Same-day dispatches</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
