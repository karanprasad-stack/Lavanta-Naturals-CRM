import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/sales';
import { SALES_CHANNEL_CONFIGS, SalesChannel } from '../../data/salesChannels';
import { Customer } from '../../types/customer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeRole } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = activeRole === 'FOUNDER' || activeRole === 'MANAGER';

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load order detail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleConfirmOrder = async () => {
    if (!order) return;
    if (!window.confirm(`Confirm order ${order.orderNumber}?`)) return;

    try {
      setActionLoading(true);
      const updated = await orderService.confirmOrder(order._id);
      setOrder(updated);
      showToast(`Order ${updated.orderNumber} confirmed!`, 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = window.prompt(`Enter cancellation reason for ${order.orderNumber}:`);
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      const updated = await orderService.cancelOrder(order._id, reason.trim());
      setOrder(updated);
      showToast(`Order ${updated.orderNumber} cancelled.`, 'warning');
      loadOrder();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await orderService.updateOrderStatus(order._id, newStatus);
      setOrder(updated);
      showToast(`Order status updated to ${newStatus}`, 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentChange = async (newPaymentStatus: PaymentStatus) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await orderService.updatePaymentStatus(order._id, newPaymentStatus);
      setOrder(updated);
      showToast(`Payment status updated to ${newPaymentStatus}`, 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
        <Loading size="lg" message="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <Button variant="outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const customer = typeof order.customerId === 'object' ? (order.customerId as Customer) : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/orders')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Main Order Header Card */}
      <div className="luxury-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {order.orderNumber}
              </h1>
              {(() => {
                const chKey = (order.salesChannel || 'WEBSITE') as SalesChannel;
                const cfg = SALES_CHANNEL_CONFIGS[chKey] || SALES_CHANNEL_CONFIGS.WEBSITE;
                return (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: `${cfg.color}15`,
                    color: cfg.color,
                    border: `1px solid ${cfg.color}40`
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.color }} />
                    {cfg.name}
                  </span>
                );
              })()}
              {order.source && (
                <Badge variant="sage">{order.source}</Badge>
              )}
            </div>

            {order.externalOrderId && (
              <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.35rem', fontFamily: 'monospace' }}>
                <strong>External Order ID:</strong> {order.externalOrderId}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6B7280', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              {order.createdBy && (
                <span>Recorded by: <strong>{order.createdBy.name}</strong></span>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '2px' }}>Order Status</div>
              <Badge
                variant={
                  order.orderStatus === 'DELIVERED'
                    ? 'forest'
                    : order.orderStatus === 'CANCELLED'
                    ? 'danger'
                    : order.orderStatus === 'SHIPPED'
                    ? 'sage'
                    : order.orderStatus === 'PROCESSING'
                    ? 'gold'
                    : order.orderStatus === 'CONFIRMED'
                    ? 'green'
                    : 'warning'
                }
              >
                {order.orderStatus}
              </Badge>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '2px' }}>Payment</div>
              <Badge variant={order.paymentStatus === 'PAID' ? 'forest' : order.paymentStatus === 'REFUNDED' ? 'sage' : 'warning'}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Controls Bar for Managers / Founders */}
        {canManage && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {order.orderStatus === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  icon={<CheckCircle2 size={15} />}
                  onClick={handleConfirmOrder}
                >
                  Confirm Order
                </Button>
              )}

              {order.orderStatus === 'CONFIRMED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusTransition('PROCESSING')}
                >
                  Mark as Processing
                </Button>
              )}

              {order.orderStatus === 'PROCESSING' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  icon={<Truck size={15} />}
                  onClick={() => handleStatusTransition('SHIPPED')}
                >
                  Mark as Shipped
                </Button>
              )}

              {order.orderStatus === 'SHIPPED' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  icon={<CheckCircle2 size={15} />}
                  onClick={() => handleStatusTransition('DELIVERED')}
                >
                  Mark as Delivered
                </Button>
              )}

              {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  icon={<XCircle size={15} />}
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              )}
            </div>

            {/* Payment Transition Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Update Payment:</span>
              <select
                value={order.paymentStatus}
                onChange={(e) => handlePaymentChange(e.target.value as PaymentStatus)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.8rem',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        )}

        {order.cancelReason && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '0.85rem' }}>
            <strong>Cancellation Reason:</strong> {order.cancelReason}
          </div>
        )}
      </div>

      {/* Grid: Customer Info & Line Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {/* Customer Card */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            <User size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>Customer & Delivery</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Client Name</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>{customer?.name || 'Walk-in Client'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Contact Details</div>
              <div style={{ color: '#374151' }}>{customer?.phone || 'No phone provided'}</div>
              {customer?.email && <div style={{ color: '#374151' }}>{customer.email}</div>}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Delivery Destination</div>
              <div style={{ color: '#374151' }}>
                {customer?.address ? `${customer.address}, ` : ''}
                {customer?.city ? `${customer.city}, ` : ''}
                {customer?.state ? `${customer.state} ` : ''}
                {customer?.pincode ? `- ${customer.pincode}` : ''}
              </div>
            </div>

            {order.notes && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Order Instructions</div>
                <div style={{ fontStyle: 'italic', color: '#4B5563' }}>"{order.notes}"</div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            <CreditCard size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>Price & Invoice Breakdown</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 500 }}>₹{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                <span>Discounts Applied:</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
              <span>Tax (GST 18%):</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
              <span>Shipping Fee:</span>
              <span>₹{order.shipping.toFixed(2)}</span>
            </div>

            {order.marketplaceFee !== undefined && order.marketplaceFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                <span>Channel / Marketplace Fee:</span>
                <span>-₹{order.marketplaceFee.toFixed(2)}</span>
              </div>
            )}

            <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              <span>Grand Total:</span>
              <span>₹{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {order.netAmount !== undefined && order.netAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Net Commercial Settlement:</span>
                <span>₹{order.netAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Products Table Card */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Ordered Catalog Items ({order.items.length})
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1.25rem' }}>Product Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem' }}>Unit Price</th>
              <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Discount</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#111827' }}>
                  {item.productNameSnapshot}
                </td>
                <td style={{ padding: '0.9rem 1rem', color: '#6B7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {item.skuSnapshot}
                </td>
                <td style={{ padding: '0.9rem 1rem', color: '#374151' }}>
                  ₹{item.unitPrice.toFixed(2)}
                </td>
                <td style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '0.9rem 1rem', color: item.discount > 0 ? '#DC2626' : '#6B7280' }}>
                  {item.discount > 0 ? `-₹${item.discount.toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                  ₹{item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Trail Timeline */}
      {order.activities && order.activities.length > 0 && (
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            <Clock size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>Order History & Audit Trail</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.activities.map((act) => (
              <div key={act._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{act.type.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#6B7280', marginLeft: '6px' }}>by {act.userId?.name || 'System'}</span>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
