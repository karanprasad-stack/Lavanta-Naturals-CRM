import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/sales';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeRole } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const canManageOrders = activeRole === 'FOUNDER' || activeRole === 'MANAGER';

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        search: search.trim() || undefined,
        orderStatus: statusFilter,
        paymentStatus: paymentFilter,
        page,
        limit: 15
      });
      setOrders(res.data);
      setTotalPages(res.pagination.pages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleQuickConfirm = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Confirm order ${orderNumber}? This will immediately deduct inventory.`)) return;
    try {
      await orderService.confirmOrder(orderId);
      showToast(`Order ${orderNumber} confirmed & stock deducted!`, 'success');
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
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Sales & Orders Management
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Manage omnichannel orders, inventory fulfillment manifests, customer deliveries, and sales pipelines
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(activeRole === 'FOUNDER' || activeRole === 'MANAGER') && (
            <Button
              variant="outline"
              onClick={() => navigate('/sales')}
            >
              Sales Analytics
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/orders/new')}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="luxury-card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by order # (LN-2026-...), customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
            <Loading size="lg" message="Loading sales orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              {search || statusFilter !== 'ALL' || paymentFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'No sales orders created yet. Get started by booking your first customer order.'}
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/orders/new')}>
              Create Order
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Order Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const customerObj = typeof ord.customerId === 'object' ? ord.customerId : null;
                  const totalUnits = ord.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr
                      key={ord._id}
                      style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FBFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                        <button
                          onClick={() => navigate(`/orders/${ord._id}`)}
                          style={{
                            color: 'var(--color-primary)',
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
                        {ord.inventoryDeducted && (
                          <div style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <CheckCircle2 size={11} /> Stock deducted
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: '#111827' }}>
                          {customerObj?.name || 'Walk-in Client'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {customerObj?.phone || customerObj?.city || 'Retail'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1rem', color: '#6B7280', fontSize: '0.8rem' }}>
                        {new Date(ord.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{ fontWeight: 500, color: '#111827' }}>
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          ({totalUnits} units)
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        ₹{ord.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        {getStatusBadge(ord.orderStatus)}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        {getPaymentBadge(ord.paymentStatus)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            title="View Order Details"
                            onClick={() => navigate(`/orders/${ord._id}`)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                              background: '#FFFFFF',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {canManageOrders && ord.orderStatus === 'PENDING' && (
                            <button
                              title="Confirm Order & Deduct Stock"
                              onClick={() => handleQuickConfirm(ord._id, ord.orderNumber)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #BBF7D0',
                                background: '#F0FDF4',
                                cursor: 'pointer',
                                color: '#16A34A'
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
                                border: '1px solid #FECDD3',
                                background: '#FFF1F2',
                                cursor: 'pointer',
                                color: '#E11D48'
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
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
    </div>
  );
};
