import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  FileText,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Check,
  X
} from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { Expense, ExpenseStatus, ExpenseCategory } from '../../types/expenses';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeRole, currentUser } = useAuth();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = activeRole === 'FOUNDER' || activeRole === 'MANAGER' || activeRole === 'HR';
  const canPay = activeRole === 'FOUNDER';

  const loadExpense = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await expenseService.getExpenseById(id);
      setExpense(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load expense details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpense();
  }, [id]);

  const handleSubmitDraft = async () => {
    if (!expense) return;
    try {
      setActionLoading(true);
      const updated = await expenseService.submitExpense(expense._id);
      setExpense(updated);
      showToast('Expense submitted for approval!', 'success');
      loadExpense();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!expense) return;
    if (!window.confirm(`Approve expense "${expense.title}" for ₹${expense.amount.toLocaleString()}?`)) return;

    try {
      setActionLoading(true);
      const updated = await expenseService.approveExpense(expense._id);
      setExpense(updated);
      showToast('Expense approved successfully!', 'success');
      loadExpense();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!expense) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      showToast('Please provide a rejection reason of at least 5 characters', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await expenseService.rejectExpense(expense._id, rejectionReason.trim());
      setExpense(updated);
      showToast('Expense rejected', 'warning');
      setRejectModalOpen(false);
      loadExpense();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!expense) return;
    const ref = window.prompt(`Enter reimbursement payment reference for "${expense.title}":`, 'NEFT-');
    if (ref === null) return;

    try {
      setActionLoading(true);
      const updated = await expenseService.payExpense(expense._id, ref.trim() || undefined);
      setExpense(updated);
      showToast('Expense marked as PAID!', 'success');
      loadExpense();
    } catch (err: any) {
      showToast(err.message || 'Failed to mark expense as paid', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
        <Loading size="lg" message="Loading expense claim details..." />
      </div>
    );
  }

  if (!expense) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2>Expense Record Not Found</h2>
        <Button variant="outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/expenses')}>
          Back to Expenses
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="forest">Paid</Badge>;
      case 'APPROVED':
        return <Badge variant="green">Approved</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">Submitted</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="sage">Cancelled</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/expenses')}
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
        <ArrowLeft size={16} /> Back to Expenses
      </button>

      {/* Main Expense Header Card */}
      <div className="luxury-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {expense.title}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6B7280', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Date: {new Date(expense.expenseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>Department: <strong>{expense.department}</strong></span>
              <span>Category: <strong>{expense.category}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              ₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {getStatusBadge(expense.status)}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {expense.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                icon={<CheckCircle2 size={15} />}
                onClick={handleSubmitDraft}
              >
                Submit for Approval
              </Button>
            )}

            {canApprove && expense.status === 'SUBMITTED' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  icon={<Check size={15} />}
                  onClick={handleApprove}
                >
                  Approve Claim
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  icon={<X size={15} />}
                  onClick={() => setRejectModalOpen(true)}
                >
                  Reject Claim
                </Button>
              </>
            )}

            {canPay && expense.status === 'APPROVED' && (
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                icon={<DollarSign size={15} />}
                onClick={handlePay}
              >
                Disburse & Mark Paid
              </Button>
            )}
          </div>

          {expense.paymentReference && (
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Payment Ref: <strong>{expense.paymentReference}</strong>
            </div>
          )}
        </div>

        {/* Rejection Alert if rejected */}
        {expense.rejectionReason && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '0.875rem' }}>
            <strong>Rejection Explanation:</strong> {expense.rejectionReason}
          </div>
        )}
      </div>

      {/* Details & Metadata Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {/* Description and Justification */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            Business Purpose & Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Description</div>
              <div style={{ color: '#111827', marginTop: '2px' }}>
                {expense.description || 'No detailed description specified.'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Payment Mode</div>
              <div style={{ color: '#374151', fontWeight: 500 }}>
                {expense.paymentMethod || 'BANK_TRANSFER'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tax Deductible</div>
              <div style={{ color: '#374151' }}>
                {expense.taxDeductible ? 'Yes, valid GST invoice tax deductible' : 'No'}
              </div>
            </div>

            {expense.notes && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Notes</div>
                <div style={{ fontStyle: 'italic', color: '#4B5563' }}>{expense.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Submitter & Receipt Attachment Card */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            Submitter & Receipt
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Submitted By</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>{expense.submittedBy?.name || 'Team Member'}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{expense.submittedBy?.email}</div>
            </div>

            {/* Receipt Box */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Attached Receipt / Voucher</div>
              {expense.receipt?.storageKey ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
                        {expense.receipt.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {(expense.receipt.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/api/expenses/${expense._id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: 'var(--color-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              ) : (
                <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                  No digital receipt uploaded for this expense.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Timeline */}
      {expense.activities && expense.activities.length > 0 && (
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
            <Clock size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>Expense Lifecycle History</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {expense.activities.map((act) => (
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

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Expense Claim"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>
            Please provide a mandatory explanation for rejecting this expenditure.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              Rejection Reason * (Minimum 5 characters)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Rate card mismatch, please upload original supplier bill..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={handleConfirmReject}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
