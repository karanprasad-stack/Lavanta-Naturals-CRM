import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Calendar,
  Layers,
  Edit3,
  TrendingUp,
  FileText,
  Clock,
  User,
  Plus,
  Minus,
  Archive,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { ProductItem, InventoryMovementItem } from '../../types/inventory';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const canManage = ['FOUNDER', 'MANAGER'].includes(userRole);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Movement Modal State
  const [modalType, setModalType] = useState<'STOCK_IN' | 'STOCK_OUT' | null>(null);
  const [actionQuantity, setActionQuantity] = useState<number>(1);
  const [actionReason, setActionReason] = useState<string>('');
  const [actionReference, setActionReference] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await productService.getProductById(id);
      setProduct(data.product);
      setMovements(data.recentMovements || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleQuickMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !modalType) return;

    if (actionQuantity <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    if (!actionReason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await inventoryService.recordMovement({
        productId: product._id,
        type: modalType,
        quantity: actionQuantity,
        reason: actionReason.trim(),
        reference: actionReference.trim()
      });

      showToast(
        `Stock ${modalType === 'STOCK_IN' ? 'added' : 'deducted'} successfully (${res.product.stockQuantity} remaining)`,
        'success'
      );
      setProduct(res.product);
      setModalType(null);
      setActionQuantity(1);
      setActionReason('');
      setActionReference('');
      // Refresh movements
      fetchProduct();
    } catch (err: any) {
      showToast(err.message || 'Stock action failed', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleArchive = async () => {
    if (!product) return;
    if (!window.confirm(`Are you sure you want to archive "${product.name}"?`)) return;

    try {
      const res = await productService.deleteProduct(product._id);
      showToast(res.message, 'success');
      navigate('/products');
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="bg-white p-8 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-6 animate-pulse">
          <div className="flex gap-6">
            <div className="w-48 h-48 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-3 flex-1">
              <div className="w-64 h-8 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-96 h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-[#EAEFE9] text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#1B2533]">Product Not Found</h2>
        <p className="text-sm text-[#5A667A] mt-1">{error || 'The requested product could not be found.'}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#69C43F] text-white text-sm font-medium rounded-xl hover:bg-[#5BAE37]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  const catName = typeof product.categoryId === 'object' && product.categoryId ? product.categoryId.name : 'Uncategorized';
  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80';

  const stockStatus = product.stockStatus || (product.stockQuantity === 0 ? 'OUT_OF_STOCK' : product.stockQuantity <= product.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK');

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-[#5A667A] hover:text-[#1B2533] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products Catalog
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              to={`/products/${product._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#1B2533] bg-white border border-[#EAEFE9] rounded-xl hover:bg-[#FAFBF8] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#69C43F]" />
              Edit Details
            </Link>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
          </div>
        )}
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-[#EAEFE9] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
          {/* Product Image Gallery */}
          <div className="md:col-span-4 space-y-3">
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-[#EAEFE9] bg-[#FAFBF8] flex items-center justify-center">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as any).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} preview ${idx + 1}`}
                    className="w-14 h-14 rounded-lg object-cover border border-[#EAEFE9] shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Prominent Stock Banner */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F3] text-[#1B2533] border border-[#EAEFE9]">
                  SKU: {product.sku}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#F0F9ED] text-[#69C43F] border border-[#D5EED0]">
                  {catName}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                    product.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  Status: {product.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2533]">{product.name}</h1>
              <p className="text-sm text-[#5A667A] leading-relaxed">{product.description || 'No description provided.'}</p>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {product.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs text-[#5A667A] px-2.5 py-0.5 rounded-full bg-[#FAFBF8] border border-[#EAEFE9]"
                    >
                      <Tag className="w-3 h-3 text-[#69C43F]" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Current Stock & Price Box */}
            <div className="bg-[#FAFBF8] p-5 rounded-2xl border border-[#EAEFE9] grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selling Price */}
              <div>
                <span className="text-xs text-[#8C9BAE] block uppercase tracking-wider font-semibold">Selling Price</span>
                <div className="text-2xl font-extrabold text-[#1B2533] mt-1">
                  ₹{product.sellingPrice?.toLocaleString('en-IN')}
                </div>
                {product.costPrice > 0 && (
                  <span className="text-xs text-[#5A667A] mt-0.5 block">
                    Cost: ₹{product.costPrice?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Current Stock */}
              <div>
                <span className="text-xs text-[#8C9BAE] block uppercase tracking-wider font-semibold">Current Stock</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#1B2533]">{product.stockQuantity}</span>
                  <span className="text-sm font-medium text-[#5A667A]">{product.unit.toLowerCase()}s</span>
                </div>
                <div className="text-xs text-[#8C9BAE] mt-0.5">Threshold: {product.lowStockThreshold}</div>
              </div>

              {/* Stock Status Badge */}
              <div className="flex flex-col justify-center">
                <span className="text-xs text-[#8C9BAE] block uppercase tracking-wider font-semibold mb-1">
                  Stock Status
                </span>
                {stockStatus === 'IN_STOCK' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    In Stock (Healthy)
                  </div>
                )}
                {stockStatus === 'LOW_STOCK' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 text-amber-800 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Low Stock Alert
                  </div>
                )}
                {stockStatus === 'OUT_OF_STOCK' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100/80 text-rose-800 text-xs font-semibold">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            {canManage && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setModalType('STOCK_IN')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Stock (Restock)
                </button>
                <button
                  onClick={() => setModalType('STOCK_OUT')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B2533] bg-[#F4F6F3] hover:bg-[#EAEFE9] border border-[#EAEFE9] rounded-xl transition-colors"
                >
                  <Minus className="w-4 h-4" />
                  Remove Stock
                </button>
                <Link
                  to={`/inventory/adjust?productId=${product._id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B2533] bg-white hover:bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#69C43F]" />
                  Stock Adjustment
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Documents Section */}
      {product.documentIds && product.documentIds.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2533] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#69C43F]" />
              Linked Documents & SOPs ({product.documentIds.length})
            </h2>
            <Link to="/documents" className="text-xs text-[#69C43F] hover:underline">
              Documents Library
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {product.documentIds.map((doc: any) => (
              <Link
                key={doc._id}
                to={`/documents/${doc._id}`}
                className="p-3.5 rounded-xl border border-[#EAEFE9] bg-[#FAFBF8] hover:bg-[#F2F5F0] transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EAEFE9] flex items-center justify-center text-[#69C43F] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1B2533] truncate">{doc.title}</div>
                  <div className="text-[11px] text-[#8C9BAE] uppercase">{doc.fileType || 'DOC'}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Activity Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1B2533] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#69C43F]" />
              Inventory Activity
            </h2>
            <p className="text-xs text-[#5A667A]">Historical log of all stock movements for this product.</p>
          </div>
          <Link
            to={`/inventory/history?productId=${product._id}`}
            className="text-xs font-medium text-[#69C43F] hover:underline"
          >
            View Full Audit Trail
          </Link>
        </div>

        {movements.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#5A667A] bg-[#FAFBF8] rounded-2xl border border-dashed border-[#EAEFE9]">
            No inventory movements recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {movements.map(m => {
              const isPositive = [
                'OPENING_STOCK',
                'STOCK_IN',
                'ADJUSTMENT_IN',
                'RETURNED',
                'TRANSFER_IN'
              ].includes(m.type);

              const formattedDate = new Date(m.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div
                  key={m._id}
                  className="flex items-start justify-between p-4 bg-[#FAFBF8] rounded-2xl border border-[#EAEFE9] hover:border-[#D5EED0] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1B2533]">
                          {m.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-[#8C9BAE]">
                          {m.previousQuantity} → {m.newQuantity} {product.unit.toLowerCase()}s
                        </span>
                      </div>
                      <p className="text-xs text-[#5A667A]">{m.reason}</p>
                      {m.reference && (
                        <span className="inline-block text-[10px] font-mono text-[#8C9BAE] bg-white px-1.5 py-0.5 rounded border border-[#EAEFE9]">
                          Ref: {m.reference}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-xs text-[#8C9BAE] block">{formattedDate}</span>
                    {m.performedBy && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#5A667A]">
                        <User className="w-3 h-3 text-[#8C9BAE]" />
                        {m.performedBy.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stock Movement Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEFE9] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F2F5F0] pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    modalType === 'STOCK_IN'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {modalType === 'STOCK_IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-[#1B2533]">
                  {modalType === 'STOCK_IN' ? 'Add Stock (Restocking)' : 'Remove Stock (Dispatch)'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-[#8C9BAE] hover:text-[#1B2533] p-1 rounded-lg hover:bg-[#F2F5F0]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Product
                </label>
                <div className="p-2.5 bg-[#FAFBF8] rounded-xl border border-[#EAEFE9] text-xs font-medium text-[#1B2533]">
                  {product.name} ({product.sku})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Quantity to {modalType === 'STOCK_IN' ? 'Add' : 'Deduct'} ({product.unit.toLowerCase()}s) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={modalType === 'STOCK_OUT' ? product.stockQuantity : 99999}
                  required
                  value={actionQuantity}
                  onChange={e => setActionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
                <span className="text-[11px] text-[#8C9BAE] mt-1 block">
                  Current Stock: {product.stockQuantity} → New Stock:{' '}
                  <strong>
                    {modalType === 'STOCK_IN'
                      ? product.stockQuantity + Number(actionQuantity)
                      : Math.max(0, product.stockQuantity - Number(actionQuantity))}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalType === 'STOCK_IN'
                      ? 'e.g. Batch #401 restocking received'
                      : 'e.g. Fulfillment order dispatch or retail sample'
                  }
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-881, BATCH-12"
                  value={actionReference}
                  onChange={e => setActionReference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2F5F0]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-medium text-[#5A667A] hover:bg-[#F2F5F0] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-xl shadow-xs transition-colors ${
                    modalType === 'STOCK_IN'
                      ? 'bg-[#69C43F] hover:bg-[#5BAE37]'
                      : 'bg-[#1B2533] hover:bg-[#2D3748]'
                  }`}
                >
                  {submittingAction ? 'Recording...' : 'Confirm Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
