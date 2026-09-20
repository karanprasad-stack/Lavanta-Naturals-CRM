import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Search,
  History,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import {
  ProductItem,
  ProductCategory,
  InventorySummaryStats,
  StockStatusType
} from '../../types/inventory';

export const InventoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const canManageStock = ['FOUNDER', 'MANAGER'].includes(userRole);

  const [inventory, setInventory] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [summary, setSummary] = useState<InventorySummaryStats>({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
    inStock: 0
  });

  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockStatusType | ''>('');

  // Quick Action Modal State
  const [modalItem, setModalItem] = useState<{
    product: ProductItem;
    type: 'STOCK_IN' | 'STOCK_OUT';
  } | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalReason, setModalReason] = useState('');
  const [modalRef, setModalRef] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Categories & Summary Stats
  useEffect(() => {
    productService
      .getCategories(false)
      .then(cats => setCategories(cats))
      .catch(err => console.error('Failed to load categories:', err));

    inventoryService
      .getSummary()
      .then(s => setSummary(s))
      .catch(err => console.error('Failed to load summary stats:', err));
  }, []);

  // Fetch Inventory table
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory({
        search: debouncedSearch,
        category: selectedCategory,
        stockStatus: selectedStockStatus,
        page: currentPage,
        limit: 25
      });
      setInventory(res.inventory);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, selectedCategory, selectedStockStatus, currentPage]);

  const handleQuickStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;

    if (modalQty <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    if (!modalReason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }

    try {
      setModalSubmitting(true);
      const res = await inventoryService.recordMovement({
        productId: modalItem.product._id,
        type: modalItem.type,
        quantity: modalQty,
        reason: modalReason.trim(),
        reference: modalRef.trim()
      });

      showToast(
        `Stock movement recorded: ${modalItem.type === 'STOCK_IN' ? '+' : '-'}${modalQty} (${res.product.stockQuantity} ${res.product.unit.toLowerCase()}s now)`,
        'success'
      );
      setModalItem(null);
      setModalQty(1);
      setModalReason('');
      setModalRef('');
      // Refresh
      fetchInventory();
      inventoryService.getSummary().then(s => setSummary(s));
    } catch (err: any) {
      showToast(err.message || 'Movement failed', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B2533]">Inventory</h1>
            <p className="text-sm text-[#5A667A]">Track stock levels and inventory movement.</p>
          </div>
        </div>

        {/* Quick Route Navigations */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/inventory/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B2533] bg-[#FAFBF8] hover:bg-[#F2F5F0] border border-[#EAEFE9] rounded-xl transition-colors"
          >
            <History className="w-4 h-4 text-[#5A667A]" />
            Movement History
          </Link>
          <Link
            to="/inventory/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B2533] bg-[#FAFBF8] hover:bg-[#F2F5F0] border border-[#EAEFE9] rounded-xl transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-[#5A667A]" />
            Trends & Analytics
          </Link>
          {canManageStock && (
            <Link
              to="/inventory/adjust"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Stock Adjustment
            </Link>
          )}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Total Products</span>
            <div className="text-2xl font-extrabold text-[#1B2533] mt-0.5">{summary.totalProducts}</div>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F3FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Total Units in Stock</span>
            <div className="text-2xl font-extrabold text-[#1B2533] mt-0.5">{summary.totalUnits?.toLocaleString()}</div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Low Stock Alert</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{summary.lowStock}</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Out of Stock</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{summary.outOfStock}</div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {(summary.lowStock > 0 || summary.outOfStock > 0) && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-900 font-medium">
              {summary.outOfStock > 0
                ? `${summary.outOfStock} product(s) are completely out of stock and ${summary.lowStock} product(s) are below safety thresholds.`
                : `${summary.lowStock} product(s) are currently below their minimum safety stock threshold.`}
            </span>
          </div>
          <Link
            to="/inventory/dashboard"
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0"
          >
            View Restock List →
          </Link>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9BAE]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stock by product name, SKU, brand..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Category"
            className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-48">
          <select
            value={selectedStockStatus}
            onChange={e => {
              setSelectedStockStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            aria-label="Filter by Stock Status"
            className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table & Mobile Cards */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-[#EAEFE9] space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#EAEFE9] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[#1B2533]">No inventory items found</h3>
          <p className="text-xs text-[#5A667A] mt-1">Try resetting search filters or add products to the catalog.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#EAEFE9] shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFBF8] text-[#5A667A] font-semibold text-xs border-b border-[#EAEFE9]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Threshold</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F5F0]">
                {inventory.map(item => {
                  const catName = typeof item.categoryId === 'object' && item.categoryId ? item.categoryId.name : 'Uncategorized';
                  const thumbnail = item.images?.[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&auto=format&fit=crop&q=80';
                  const updatedDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  const isLow = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;
                  const isOut = item.stockQuantity === 0;

                  return (
                    <tr key={item._id} className="hover:bg-[#FAFBF8] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#EAEFE9] bg-white shrink-0"
                          />
                          <div>
                            <Link
                              to={`/products/${item._id}`}
                              className="font-medium text-[#1B2533] hover:text-[#69C43F] transition-colors"
                            >
                              {item.name}
                            </Link>
                            <span className="text-xs text-[#8C9BAE] block">{item.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <code className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#F4F6F3] text-[#2D3748]">
                          {item.sku}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5A667A]">{catName}</td>
                      <td className="py-3.5 px-4 font-bold text-[#1B2533]">
                        <span className={`text-base ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-[#1B2533]'}`}>
                          {item.stockQuantity}
                        </span>{' '}
                        <span className="text-xs font-normal text-[#5A667A]">{item.unit.toLowerCase()}s</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8C9BAE]">
                        {item.lowStockThreshold} {item.unit.toLowerCase()}s
                      </td>
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8C9BAE]">{updatedDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/products/${item._id}`}
                            className="p-1.5 text-[#5A667A] hover:text-[#1B2533] hover:bg-[#F2F5F0] rounded-lg transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canManageStock && (
                            <>
                              <button
                                onClick={() => setModalItem({ product: item, type: 'STOCK_IN' })}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Add Stock"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModalItem({ product: item, type: 'STOCK_OUT' })}
                                disabled={item.stockQuantity === 0}
                                className="p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                                title="Remove Stock"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/inventory/adjust?productId=${item._id}`}
                                className="p-1.5 text-[#5A667A] hover:text-[#69C43F] hover:bg-[#F0F9ED] rounded-lg transition-colors"
                                title="Adjust"
                              >
                                <SlidersHorizontal className="w-4 h-4" />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {inventory.map(item => {
              const catName = typeof item.categoryId === 'object' && item.categoryId ? item.categoryId.name : 'Uncategorized';
              const thumbnail = item.images?.[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&auto=format&fit=crop&q=80';
              const isLow = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;
              const isOut = item.stockQuantity === 0;

              return (
                <div key={item._id} className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={thumbnail}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#EAEFE9] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-[#F4F6F3]">
                          {item.sku}
                        </code>
                        <span className="text-xs text-[#8C9BAE]">{catName}</span>
                      </div>
                      <Link to={`/products/${item._id}`} className="font-semibold text-sm text-[#1B2533] mt-1 block truncate">
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-base font-extrabold text-[#1B2533]">
                          {item.stockQuantity} {item.unit.toLowerCase()}s
                        </span>
                        {isOut ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            HEALTHY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageStock && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#F2F5F0]">
                      <button
                        onClick={() => setModalItem({ product: item, type: 'STOCK_IN' })}
                        className="flex-1 py-1.5 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl"
                      >
                        + Add Stock
                      </button>
                      <button
                        onClick={() => setModalItem({ product: item, type: 'STOCK_OUT' })}
                        disabled={item.stockQuantity === 0}
                        className="flex-1 py-1.5 text-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 disabled:opacity-40 rounded-xl"
                      >
                        - Deduct
                      </button>
                      <Link
                        to={`/inventory/adjust?productId=${item._id}`}
                        className="px-3 py-1.5 text-center text-xs font-semibold text-[#1B2533] bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl"
                      >
                        Adjust
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-[#EAEFE9] text-sm">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EAEFE9] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[#5A667A]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EAEFE9] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick Stock Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEFE9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F2F5F0] pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    modalItem.type === 'STOCK_IN'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {modalItem.type === 'STOCK_IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-[#1B2533]">
                  {modalItem.type === 'STOCK_IN' ? 'Restock Product' : 'Record Stock Out'}
                </h3>
              </div>
              <button onClick={() => setModalItem(null)} className="text-[#8C9BAE] hover:text-[#1B2533]">
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">Product</label>
                <div className="p-2.5 bg-[#FAFBF8] rounded-xl border border-[#EAEFE9] text-xs font-medium text-[#1B2533]">
                  {modalItem.product.name} ({modalItem.product.sku})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Quantity ({modalItem.product.unit.toLowerCase()}s) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={modalItem.type === 'STOCK_OUT' ? modalItem.product.stockQuantity : 99999}
                  required
                  value={modalQty}
                  onChange={e => setModalQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
                <span className="text-[11px] text-[#8C9BAE] mt-1 block">
                  Current: {modalItem.product.stockQuantity} → After Movement:{' '}
                  <strong>
                    {modalItem.type === 'STOCK_IN'
                      ? modalItem.product.stockQuantity + Number(modalQty)
                      : Math.max(0, modalItem.product.stockQuantity - Number(modalQty))}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalItem.type === 'STOCK_IN'
                      ? 'e.g. Received shipment from manufacturer'
                      : 'e.g. Dispatched for store order'
                  }
                  value={modalReason}
                  onChange={e => setModalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-1029, LOT-33"
                  value={modalRef}
                  onChange={e => setModalRef(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2F5F0]">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-[#5A667A] hover:bg-[#F2F5F0] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs ${
                    modalItem.type === 'STOCK_IN'
                      ? 'bg-[#69C43F] hover:bg-[#5BAE37]'
                      : 'bg-[#1B2533] hover:bg-[#2D3748]'
                  }`}
                >
                  {modalSubmitting ? 'Recording...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
