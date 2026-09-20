import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Globe
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLogItem, AuditAction } from '../../types/audit';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drawer for inspecting raw metadata
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        page,
        limit: 25,
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      if (res?.data) {
        setLogs(res.data);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: AuditAction) => {
    if (action === 'LOGIN') return <Badge variant="forest">LOGIN</Badge>;
    if (action === 'FAILED_LOGIN') return <Badge variant="danger">FAILED LOGIN</Badge>;
    if (action === 'LOGOUT') return <Badge variant="neutral">LOGOUT</Badge>;
    if (action === 'ORDER_CONFIRMED' || action === 'EXPENSE_APPROVED') return <Badge variant="green">{action.replace('_', ' ')}</Badge>;
    if (action === 'ORDER_CANCELLED' || action === 'EXPENSE_REJECTED') return <Badge variant="danger">{action.replace('_', ' ')}</Badge>;
    if (action === 'STOCK_ADJUSTED' || action === 'ROLE_CHANGED') return <Badge variant="warning">{action.replace('_', ' ')}</Badge>;
    if (action === 'EXPORT_GENERATED') return <Badge variant="lavender">EXPORT</Badge>;
    return <Badge variant="sage">{action.replace('_', ' ')}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <ShieldAlert size={18} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Security & Compliance Audit Log
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Immutable chronological audit record of sensitive security operations, data changes, and authentication events.
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Total Events: {total.toLocaleString()}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            className="input-field"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search action, IP, or entity ID..."
            style={{ margin: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--color-text-muted)" />
          <select
            className="input-field"
            value={actionFilter}
            onChange={e => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            style={{ margin: 0, width: 'auto' }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="FAILED_LOGIN">FAILED LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="USER_CREATED">USER CREATED</option>
            <option value="USER_UPDATED">USER UPDATED</option>
            <option value="ROLE_CHANGED">ROLE CHANGED</option>
            <option value="ORDER_CONFIRMED">ORDER CONFIRMED</option>
            <option value="ORDER_CANCELLED">ORDER CANCELLED</option>
            <option value="EXPENSE_APPROVED">EXPENSE APPROVED</option>
            <option value="EXPENSE_REJECTED">EXPENSE REJECTED</option>
            <option value="STOCK_ADJUSTED">STOCK ADJUSTED</option>
            <option value="PRODUCT_CREATED">PRODUCT CREATED</option>
            <option value="EXPORT_GENERATED">EXPORT GENERATED</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--color-text-muted)" />
          <input
            type="date"
            className="input-field"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            style={{ margin: 0, width: 'auto' }}
            title="Start Date"
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>to</span>
          <input
            type="date"
            className="input-field"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            style={{ margin: 0, width: 'auto' }}
            title="End Date"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem' }}>
            <Loading message="Loading security audit records..." />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <ShieldAlert size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No audit events found</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Try clearing filters or search queries.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFBF8', borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target Entity</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Network Origin</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(item => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFBF8')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="var(--color-text-muted)" />
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getActionBadge(item.action)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.userId ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {item.userId.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {item.userId.role} • {item.userId.department}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Anonymous / System</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.entityType ? (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary-deep)' }}>{item.entityType}</span>
                          {item.entityId && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                              #{item.entityId.slice(-6)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={13} color="var(--color-text-muted)" />
                        {item.ipAddress || 'Internal'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLog(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Inspect
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFBF8'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Page {page} of {totalPages}
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={14} />}
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Inspection Drawer */}
      {selectedLog && (
        <div
          className="overlay-backdrop"
          onClick={() => setSelectedLog(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1200,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xl)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Audit Event Details
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedLog.action}
                </h3>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Event ID</span>
                <code style={{ background: '#FAFBF8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {selectedLog._id}
                </code>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Timestamp</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {new Date(selectedLog.createdAt).toUTCString()}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Actor User</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedLog.userId ? `${selectedLog.userId.name} (${selectedLog.userId.email} • ${selectedLog.userId.role})` : 'System / Unauthenticated'}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>IP Address & Client</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {selectedLog.ipAddress || 'Internal'}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedLog.userAgent || 'Unknown Agent'}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>
                  Sanitized Event Metadata
                </span>
                <pre
                  style={{
                    background: '#FAFBF8',
                    border: '1px solid var(--border-color)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
