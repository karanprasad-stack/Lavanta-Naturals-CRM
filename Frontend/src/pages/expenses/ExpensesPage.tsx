import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  FileText,
  DollarSign,
  Eye,
  Check,
  X
} from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { Expense, ExpenseStatus, ExpenseCategory, ExpenseSummary } from '../../types/expenses';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, activeRole } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Rejection Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectExpenseId, setRejectExpenseId] = useState('');
  const [rejectExpenseTitle, setRejectExpenseTitle] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const canApprove = activeRole === 'FOUNDER' || activeRole === 'MANAGER' || activeRole === 'HR';
  const canPay = activeRole === 'FOUNDER';

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        expenseService.getExpenses({
          status: statusFilter,
          category: categoryFilter,
          department: departmentFilter,
          search: search.trim() || undefined,
          page,
          limit: 15
        }),
        expenseService.getExpenseSummary()
      ]);
      setExpenses(expRes.data);
      setTotalPages(expRes.pagination.pages || 1);
      setTotalCount(expRes.pagination.total || 0);
      setSummary(sumRes);
    } catch (err: any) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, departmentFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleApprove = async (id: string, title: string) => {
    if (!window.confirm(`Approve expense "${title}"?`)) return;
    try {
      await expenseService.approveExpense(id);
      showToast(`Expense "${title}" approved!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve expense', 'error');
    }
  };

  const handleOpenRejectModal = (id: string, title: string) => {
    setRejectExpenseId(id);
    setRejectExpenseTitle(title);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      showToast('Please enter a rejection reason (at least 5 characters)', 'warning');
      return;
    }

    try {
      setRejecting(true);
      await expenseService.rejectExpense(rejectExpenseId, rejectionReason.trim());
      showToast('Expense rejected', 'warning');
      setRejectModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject expense', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handlePay = async (id: string, title: string) => {
    const ref = window.prompt(`Enter disbursement payment reference for "${title}":`, 'NEFT-');
    if (ref === null) return;

    try {
      await expenseService.payExpense(id, ref.trim() || undefined);
      showToast(`Expense "${title}" marked as PAID!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to disburse payment', 'error');
    }
  };

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

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'INVENTORY':
      case 'SUPPLIES':
        return <Badge variant="forest">{cat}</Badge>;
      case 'MARKETING':
        return <Badge variant="gold">{cat}</Badge>;
      case 'SOFTWARE':
        return <Badge variant="info">{cat}</Badge>;
      case 'TRAVEL':
      case 'MAINTENANCE':
        return <Badge variant="sage">{cat}</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
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
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Expense Management & Approvals
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Track formulation compounding costs, marketing expenditures, supplies, receipts, and approval workflows
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(activeRole === 'FOUNDER' || activeRole === 'MANAGER') && (
            <Button
              variant="outline"
              onClick={() => navigate('/finance')}
            >
              Financial Overview
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/expenses/new')}
          >
            Submit Expense
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Committed Expenses
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.4rem' }}>
              ₹{summary.amounts.committed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.2rem' }}>
              Approved + Paid obligations
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Cash Outflow (Paid)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1E3A8A', marginTop: '0.4rem' }}>
              ₹{summary.amounts.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
              {summary.counts.paid} claims reimbursed
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#B45309', marginTop: '0.4rem' }}>
              ₹{summary.amounts.submitted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.2rem' }}>
              {summary.counts.submitted} expenses awaiting review
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Approved / Unpaid
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6D28D9', marginTop: '0.4rem' }}>
              ₹{summary.amounts.approved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
              {summary.counts.approved} claims ready for payment
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="luxury-card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search expenses by title, notes, or description..."
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
              style={{ padding: '0.55rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.55rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
            >
              <option value="ALL">All Categories</option>
              <option value="INVENTORY">Inventory & Raw Materials</option>
              <option value="SUPPLIES">Supplies & Packaging</option>
              <option value="MARKETING">Marketing & Advertising</option>
              <option value="SOFTWARE">Software & Cloud</option>
              <option value="SALARY">Salaries & Stipends</option>
              <option value="UTILITIES">Utilities & Rent</option>
              <option value="TRAVEL">Travel & Hospitality</option>
              <option value="MAINTENANCE">Maintenance & Lab Servicing</option>
              <option value="SHIPPING">Shipping & Logistics</option>
              <option value="OFFICE">Office & Admin</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
            <Loading size="lg" message="Loading expense ledger..." />
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Receipt size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>No expenses found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'No expense claims recorded yet.'}
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/expenses/new')}>
              Submit Expense
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Title & Description</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Submitted By</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Receipt</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr
                    key={exp._id}
                    style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FBFA')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', maxWidth: '280px' }}>
                      <button
                        onClick={() => navigate(`/expenses/${exp._id}`)}
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
                        {exp.title}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description || exp.department}
                      </div>
                      {exp.rejectionReason && (
                        <div style={{ fontSize: '0.7rem', color: '#BE123C', marginTop: '2px' }}>
                          Reason: {exp.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1rem' }}>
                      {getCategoryBadge(exp.category)}
                    </td>

                    <td style={{ padding: '1rem 1rem', color: '#6B7280', fontSize: '0.8rem' }}>
                      {new Date(exp.expenseDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td style={{ padding: '1rem 1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {exp.submittedBy?.name || 'Team Member'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {exp.department}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1rem' }}>
                      {getStatusBadge(exp.status)}
                    </td>

                    <td style={{ padding: '1rem 1rem' }}>
                      {exp.receipt?.storageKey ? (
                        <a
                          href={`/api/expenses/${exp._id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download receipt"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--color-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <FileText size={15} /> View
                        </a>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          title="View Details"
                          onClick={() => navigate(`/expenses/${exp._id}`)}
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

                        {canApprove && exp.status === 'SUBMITTED' && (
                          <>
                            <button
                              title="Approve Expense"
                              onClick={() => handleApprove(exp._id, exp.title)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #BBF7D0',
                                background: '#F0FDF4',
                                cursor: 'pointer',
                                color: '#16A34A'
                              }}
                            >
                              <Check size={15} />
                            </button>

                            <button
                              title="Reject Expense"
                              onClick={() => handleOpenRejectModal(exp._id, exp.title)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #FECDD3',
                                background: '#FFF1F2',
                                cursor: 'pointer',
                                color: '#E11D48'
                              }}
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}

                        {canPay && exp.status === 'APPROVED' && (
                          <button
                            title="Mark as Paid / Disbursed"
                            onClick={() => handlePay(exp._id, exp.title)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              cursor: 'pointer',
                              color: '#2563EB'
                            }}
                          >
                            <DollarSign size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total expenses)
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

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Expense Claim"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>
            Please state why <strong>"{rejectExpenseTitle}"</strong> is being rejected. This explanation will be logged and notified to the submitter.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              Rejection Reason * (Minimum 5 characters)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Exceeds department budget allocation; please resubmit with standard formulation rate sheet..."
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
              disabled={rejecting}
              onClick={handleConfirmReject}
            >
              {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
