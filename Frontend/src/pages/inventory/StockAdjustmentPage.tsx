import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  SlidersHorizontal,
  Package,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { ProductItem } from '../../types/inventory';

const COMMON_REASONS = [
  'Physical inventory audit count discrepancy',
  'Damaged in warehouse storage / transit',
  'Shrinkage / lost item during cycle count',
  'Customer return inspected & restocked',
  'Display / marketing demonstration sample',
  'Batch expiration quarantine',
  'Correction of previous counting entry error'
];

export const StockAdjustmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const preselectedProductId = searchParams.get('productId') || '';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const [adjustmentType, setAdjustmentType] = useState<
    'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'DAMAGED' | 'LOST' | 'RETURNED'
  >('ADJUSTMENT_OUT');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all products for the dropdown
  useEffect(() => {
    productService
      .getProducts({ limit: 100, status: 'ACTIVE' })
      .then(res => {
        setProducts(res.products);
        if (preselectedProductId) {
          const found = res.products.find(p => p._id === preselectedProductId);
          if (found) {
            setSelectedProduct(found);
            setSelectedProductId(found._id);
          }
        } else if (res.products.length > 0) {
          setSelectedProduct(res.products[0]);
          setSelectedProductId(res.products[0]._id);
        }
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, [preselectedProductId]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const found = products.find(p => p._id === prodId) || null;
    setSelectedProduct(found);
  };

  const isAddition = adjustmentType === 'ADJUSTMENT_IN' || adjustmentType === 'RETURNED';
  const currentStock = selectedProduct?.stockQuantity || 0;
  const projectedStock = isAddition
    ? currentStock + Number(quantity || 0)
    : Math.max(0, currentStock - Number(quantity || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      showToast('Please select a product', 'error');
      return;
    }

    if (!quantity || quantity <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    if (!reason.trim()) {
      showToast('A specific reason is required for stock adjustments', 'error');
      return;
    }

    if (!isAddition && quantity > currentStock) {
      showToast(`Cannot deduct ${quantity} units. Only ${currentStock} units in stock.`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      await inventoryService.recordAdjustment({
        productId: selectedProductId,
        type: adjustmentType,
        quantity: Math.round(quantity),
        reason: reason.trim(),
        reference: reference.trim(),
        notes: notes.trim()
      });

      showToast('Stock adjustment recorded successfully!', 'success');
      navigate(`/inventory/history?productId=${selectedProductId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to record stock adjustment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-sm text-[#5A667A] hover:text-[#1B2533] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2533]">Stock Adjustment</h1>
            <p className="text-xs text-[#5A667A]">
              Record physical audit counts, damaged units, shrinkage, and warehouse reconciliations.
            </p>
          </div>
        </div>
      </div>

      {/* Adjustment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#5A667A] mb-1">
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={e => handleProductChange(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) — Stock: {p.stockQuantity} {p.unit.toLowerCase()}s
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Card */}
          {selectedProduct && (
            <div className="bg-[#FAFBF8] p-4 rounded-2xl border border-[#EAEFE9] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Current Verified Stock</span>
                <div className="text-xl font-extrabold text-[#1B2533] mt-0.5">
                  {currentProductStockDisplay(selectedProduct)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Projected New Stock</span>
                <div
                  className={`text-xl font-extrabold mt-0.5 ${
                    projectedStock === 0
                      ? 'text-rose-600'
                      : projectedStock <= selectedProduct.lowStockThreshold
                      ? 'text-amber-600'
                      : 'text-[#69C43F]'
                  }`}
                >
                  {projectedStock} {selectedProduct.unit.toLowerCase()}s
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Movement Type */}
          <div>
            <label className="block text-xs font-semibold text-[#5A667A] mb-2">
              Adjustment Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { type: 'ADJUSTMENT_OUT', label: 'Audit Deficit (Deduct)', desc: 'Physical count found fewer items' },
                { type: 'ADJUSTMENT_IN', label: 'Audit Surplus (Add)', desc: 'Physical count found extra items' },
                { type: 'DAMAGED', label: 'Damaged Stock (Deduct)', desc: 'Broken glass, spills, or contamination' },
                { type: 'LOST', label: 'Lost / Missing (Deduct)', desc: 'Shrinkage or missing during transit' },
                { type: 'RETURNED', label: 'Customer Return (Add)', desc: 'Inspected and added back to shelf' }
              ].map(opt => {
                const isSelected = adjustmentType === opt.type;
                return (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => setAdjustmentType(opt.type as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-[#69C43F] bg-[#F0F9ED] ring-1 ring-[#69C43F]'
                        : 'border-[#EAEFE9] bg-[#FAFBF8] hover:bg-[#F2F5F0]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#1B2533]">{opt.label}</div>
                    <div className="text-[11px] text-[#5A667A] mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-[#5A667A] mb-1">
              Quantity to {isAddition ? 'Add' : 'Deduct'} *
            </label>
            <input
              type="number"
              min="1"
              max={!isAddition ? currentStock : 99999}
              required
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full sm:w-64 px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#5A667A] mb-1">
              Reason for Adjustment *
            </label>
            <input
              type="text"
              required
              placeholder="Provide an explicit operational reason..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            />
            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_REASONS.map((r, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setReason(r)}
                  className="text-[11px] text-[#5A667A] bg-[#FAFBF8] hover:bg-[#F2F5F0] border border-[#EAEFE9] px-2.5 py-1 rounded-lg transition-colors text-left"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Reference Code / Batch #
              </label>
              <input
                type="text"
                placeholder="e.g. AUDIT-2026-Q3, DISP-09"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Additional Notes
              </label>
              <input
                type="text"
                placeholder="Supervisor signoff or location info"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/inventory"
            className="px-5 py-2.5 text-sm font-medium text-[#5A667A] hover:text-[#1B2533] bg-white border border-[#EAEFE9] rounded-xl hover:bg-[#FAFBF8] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Applying Adjustment...' : 'Confirm Stock Adjustment'}
          </button>
        </div>
      </form>
    </div>
  );
};

function currentProductStockDisplay(prod: ProductItem) {
  return `${prod.stockQuantity} ${prod.unit.toLowerCase()}s`;
}
