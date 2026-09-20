import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  UploadCloud,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { ExpenseCategory } from '../../types/expenses';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const CreateExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('INVENTORY');
  const [department, setDepartment] = useState(currentUser?.department || 'Operations');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('Receipt file size must be less than 10MB', 'warning');
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim()) {
      showToast('Please enter an expense title', 'warning');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive amount', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const created = await expenseService.createExpense({
        title: title.trim(),
        description: description.trim() || undefined,
        amount: numAmount,
        category,
        department,
        expenseDate,
        paymentMethod,
        taxDeductible,
        notes: notes.trim() || undefined,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        receipt: receiptFile || undefined
      });

      showToast(
        `Expense "${created.title}" ${isDraft ? 'saved as draft' : 'submitted for approval'}!`,
        'success'
      );
      navigate('/expenses');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          Submit New Expense Claim
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Record internal purchases, vendor bills, laboratory supplies, and upload invoice receipts for reimbursement
        </p>
      </div>

      {/* Form Card */}
      <div className="luxury-card" style={{ padding: '2rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Expense Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Amber Glass Pipette Dropper Bottles (500 units)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Amount and Category Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Amount (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem 0.65rem 1.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="INVENTORY">Inventory & Raw Botanicals</option>
                <option value="SUPPLIES">Packaging & Supplies</option>
                <option value="MARKETING">Marketing & Advertising</option>
                <option value="SOFTWARE">Software & Subscriptions</option>
                <option value="SALARY">Salaries & Honorariums</option>
                <option value="UTILITIES">Utilities & Facility</option>
                <option value="TRAVEL">Travel & Conferences</option>
                <option value="MAINTENANCE">Equipment Maintenance</option>
                <option value="SHIPPING">Shipping & Freight</option>
                <option value="OFFICE">Office Supplies</option>
                <option value="OTHER">Other Operational Expense</option>
              </select>
            </div>
          </div>

          {/* Department, Date, Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI / Google Pay</option>
                <option value="CREDIT_CARD">Company Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH">Petty Cash</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Business Justification / Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain the necessity of this expenditure for production or operations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Receipt File Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Attach Receipt / Tax Invoice (PDF, PNG, JPG up to 10MB)
            </label>

            {!receiptFile ? (
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                border: '2px dashed #D1D5DB',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}>
                <UploadCloud size={32} color="#9CA3AF" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Click to browse and upload receipt
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                  Supports PDF or photo vouchers
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid #BBF7D0',
                backgroundColor: '#F0FDF4',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#16A34A" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      {receiptFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {(receiptFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Tax Deductible Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="taxDeductible"
              checked={taxDeductible}
              onChange={(e) => setTaxDeductible(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="taxDeductible" style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
              This expenditure is tax-deductible for GST / Corporate filings
            </label>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={submitting}
              icon={<CheckCircle2 size={16} />}
              onClick={() => handleSubmit(false)}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
