import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  AlertCircle,
  DollarSign,
  UploadCloud,
  Calendar,
  X
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus, OrderSource } from '../../types/sales';
import { SALES_CHANNELS, SALES_CHANNEL_CONFIGS, SalesChannel, getChannelMeta } from '../../data/salesChannels';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { OrderImportModal } from '../../components/orders/OrderImportModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeRole } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialStatus = (): string => {
    const s = (searchParams.get('status') || '').toUpperCase();
    if (['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(s)) {
      return s;
    }
    return 'ALL';
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(getInitialStatus());
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync state if URL search parameters change externally
  useEffect(() => {
    const urlStatus = getInitialStatus();
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
      setPage(1);
    }
  }, [searchParams]);

  const canManageOrders = activeRole === 'FOUNDER' || activeRole === 'MANAGER';

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        search: search.trim() || undefined,
        orderStatus: statusFilter,
        salesChannel: channelFilter !== 'ALL' ? (channelFilter as SalesChannel) : undefined,
        paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      setOrders([]);
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'ALL') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus.toLowerCase());
    }
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, channelFilter, paymentFilter, sourceFilter, startDate, endDate, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setPaymentFilter('ALL');
    setSourceFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleQuickConfirm = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Confirm order ${orderNumber}?`)) return;
    try {
      await orderService.confirmOrder(orderId);
      showToast(`Order ${orderNumber} confirmed!`, 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm order', 'error');
    }
  };

  const handleQuickCancel = async (orderId: string, orderNumber: string) => {
    const reason = window.prompt(`Enter cancellation reason for ${orderNumber}:`);
    if (!reason || !reason.trim()) return;
    try {
      await orderService.cancelOrder(orderId, reason.trim());
      showToast(`Order ${orderNumber} cancelled!`, 'warning');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="green">Confirmed</Badge>;
      case 'PROCESSING':
        return <Badge variant="gold">Processing</Badge>;
      case 'SHIPPED':
        return <Badge variant="sage">Shipped</Badge>;
      case 'DELIVERED':
        return <Badge variant="forest">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="forest">Paid</Badge>;
      case 'REFUNDED':
        return <Badge variant="sage">Refunded</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="gold">Partial</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Unpaid</Badge>;
    }
  };

  const getSourceBadge = (source?: OrderSource | string) => {
    switch (source) {
      case 'CSV_IMPORT':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#3B82F6',
            border: '1px solid rgba(59, 130, 246, 0.25)'
          }}>
            CSV Import
          </span>
        );
      case 'API':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            color: '#8B5CF6',
            border: '1px solid rgba(139, 92, 246, 0.25)'
          }}>
            Direct API
          </span>
        );
      case 'MANUAL':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            backgroundColor: 'rgba(107, 114, 128, 0.12)',
            color: '#9CA3AF',
            border: '1px solid rgba(107, 114, 128, 0.25)'
          }}>
            Manual
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(105, 196, 63, 0.15)',
              color: 'var(--color-primary, #69C43F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)' }}>
              Unified Order Register
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary, #9CA3AF)', fontSize: '0.875rem' }}>
            Central multi-channel order ledger consolidating sales across Website, Amazon, Flipkart, and Manual transactions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(activeRole === 'FOUNDER' || activeRole === 'MANAGER') && (
            <Button
              variant="outline"
              onClick={() => navigate('/sales')}
            >
              Sales Analytics
            </Button>
          )}

          <Button
            variant="outline"
            icon={<UploadCloud size={16} />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Orders
          </Button>

          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/orders/new')}
          >
            Create Manual Order
          </Button>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'ALL', label: 'All Orders' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'PROCESSING', label: 'Processing' },
          { key: 'SHIPPED', label: 'Shipped' },
          { key: 'DELIVERED', label: 'Delivered' },
          { key: 'CANCELLED', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleStatusFilterChange(tab.key)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === tab.key ? '1px solid var(--color-primary, #69C43F)' : '1px solid var(--border-color, #1F2D42)',
              background: statusFilter === tab.key ? 'var(--color-primary, #69C43F)' : 'var(--bg-surface-elevated, #142032)',
              color: statusFilter === tab.key ? '#FFFFFF' : 'var(--color-text-secondary, #9CA3AF)',
              boxShadow: statusFilter === tab.key ? '0 1px 3px rgba(105, 196, 63, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="luxury-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface, #0E1726)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #6B7280)' }} />
            <input
              type="text"
              placeholder="Search CRM ID, Ext Order ID, customer, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                border: '1px solid var(--border-color, #1F2D42)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-surface-elevated, #142032)',
                color: 'var(--color-text-primary, #F3F4F6)'
              }}
            />
          </div>

          {/* Channel Filter */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #9CA3AF)' }}>Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                border: '1px solid var(--border-color, #1F2D42)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-surface-elevated, #142032)',
                color: 'var(--color-text-primary, #F3F4F6)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Channels</option>
              {SALES_CHANNELS.map((ch: any) => (
                <option key={ch.code || ch.id} value={ch.code || ch.id}>{ch.displayName || ch.name}</option>
              ))}
            </select>
          </div>

          {/* Import Source Filter */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #9CA3AF)' }}>Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                border: '1px solid var(--border-color, #1F2D42)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-surface-elevated, #142032)',
                color: 'var(--color-text-primary, #F3F4F6)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Sources</option>
              <option value="MANUAL">Manual Entry</option>
              <option value="CSV_IMPORT">CSV Import</option>
              <option value="API">Direct API</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #9CA3AF)' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.5rem 0.65rem',
                border: '1px solid var(--border-color, #1F2D42)',
                borderRadius: '8px',
                fontSize: '0.825rem',
                backgroundColor: 'var(--bg-surface-elevated, #142032)',
                color: 'var(--color-text-primary, #F3F4F6)',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Date Range End */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #9CA3AF)' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.5rem 0.65rem',
                border: '1px solid var(--border-color, #1F2D42)',
                borderRadius: '8px',
                fontSize: '0.825rem',
                backgroundColor: 'var(--bg-surface-elevated, #142032)',
                color: 'var(--color-text-primary, #F3F4F6)',
                cursor: 'pointer'
              }}
            />
          </div>

          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>

          {(search || channelFilter !== 'ALL' || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || sourceFilter !== 'ALL' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #6B7280)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </form>
      </div>

      {/* Orders Table */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--bg-surface, #0E1726)' }}>
        {loading ? (
          <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
            <Loading size="lg" message="Loading sales orders..." />
          </div>
        ) : !Array.isArray(orders) || orders.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated, #142032)', color: 'var(--color-text-muted, #9CA3AF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)', marginBottom: '0.25rem' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9CA3AF)', marginBottom: '1rem' }}>
              {search || statusFilter !== 'ALL' || channelFilter !== 'ALL' || paymentFilter !== 'ALL' || sourceFilter !== 'ALL' || startDate || endDate
                ? 'Try adjusting your filters or search keywords.'
                : 'No sales orders created yet. Consolidate your first multi-channel order.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                Import Orders
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/orders/new')}>
                Create Manual Order
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated, #142032)', borderBottom: '1px solid var(--border-color, #1F2D42)', color: 'var(--color-text-secondary, #9CA3AF)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CRM Order ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>External Order ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Channel</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Source</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(orders) ? orders : []).map((ord) => {
                  const customerObj = typeof ord.customerId === 'object' ? ord.customerId : null;
                  const totalUnits = ord.items.reduce((s, i) => s + i.quantity, 0);
                  const channelKey = (ord.salesChannel || 'WEBSITE') as SalesChannel;
                  const channelCfg = getChannelMeta(channelKey);

                  return (
                    <tr
                      key={ord._id}
                      style={{ borderBottom: '1px solid var(--border-color, #1F2D42)', transition: 'background-color 0.15s' }}
                    >
                      {/* CRM Order ID */}
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600 }}>
                        <button
                          onClick={() => navigate(`/orders/${ord._id}`)}
                          style={{
                            color: 'var(--color-primary, #69C43F)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                            textAlign: 'left'
                          }}
                        >
                          {ord.orderNumber}
                        </button>
                      </td>

                      {/* External Order ID */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {ord.externalOrderId ? (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-primary, #F3F4F6)',
                            backgroundColor: 'var(--bg-surface-elevated, #142032)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color, #1F2D42)'
                          }}>
                            {ord.externalOrderId}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted, #6B7280)' }}>—</span>
                        )}
                      </td>

                      {/* Sales Channel */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: `${channelCfg.color}15`,
                          color: channelCfg.color,
                          border: `1px solid ${channelCfg.color}40`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: channelCfg.color }} />
                          {channelCfg.shortName}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #F3F4F6)' }}>
                          {customerObj?.name || `${channelCfg.shortName} Customer`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6B7280)' }}>
                          {customerObj?.phone || customerObj?.city || 'Marketplace'}
                        </div>
                      </td>

                      {/* Products / Items */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary, #F3F4F6)' }}>
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #6B7280)' }}>
                          ({totalUnits} units)
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--color-primary, #69C43F)' }}>
                        ₹{ord.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {getStatusBadge(ord.orderStatus)}
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--color-text-secondary, #9CA3AF)', fontSize: '0.8rem' }}>
                        {new Date(ord.orderDate || ord.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Source */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {getSourceBadge(ord.source)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            title="View Order Details"
                            onClick={() => navigate(`/orders/${ord._id}`)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color, #1F2D42)',
                              background: 'var(--bg-surface-elevated, #142032)',
                              cursor: 'pointer',
                              color: 'var(--color-text-secondary, #9CA3AF)'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {canManageOrders && ord.orderStatus === 'PENDING' && (
                            <button
                              title="Confirm Order"
                              onClick={() => handleQuickConfirm(ord._id, ord.orderNumber)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                background: 'rgba(16, 185, 129, 0.12)',
                                cursor: 'pointer',
                                color: '#10B981'
                              }}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {canManageOrders && ord.orderStatus !== 'DELIVERED' && ord.orderStatus !== 'CANCELLED' && (
                            <button
                              title="Cancel Order"
                              onClick={() => handleQuickCancel(ord._id, ord.orderNumber)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                cursor: 'pointer',
                                color: '#EF4444'
                              }}
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color, #1F2D42)', backgroundColor: 'var(--bg-surface-elevated, #142032)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #9CA3AF)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total orders)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <OrderImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadOrders}
      />
    </div>
  );
};

export default OrdersPage;
