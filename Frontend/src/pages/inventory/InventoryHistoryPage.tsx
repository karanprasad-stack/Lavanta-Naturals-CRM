import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  History,
  ArrowLeft,
  Search,
  Filter,
  Package,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { InventoryMovementItem, ProductItem } from '../../types/inventory';

export const InventoryHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';

  const [history, setHistory] = useState<InventoryMovementItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load products list for filter
  useEffect(() => {
    productService
      .getProducts({ limit: 100 })
      .then(res => setProducts(res.products))
      .catch(err => console.error('Failed to load products for filter:', err));
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getHistory({
        productId: selectedProductId,
        type: selectedType,
        search: debouncedSearch,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 25
      });
      setHistory(res.history);
      setTotalRecords(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [debouncedSearch, selectedProductId, selectedType, startDate, endDate, currentPage]);

  const getMovementBadge = (type: string) => {
    const isPositive = [
      'OPENING_STOCK',
      'STOCK_IN',
      'ADJUSTMENT_IN',
      'RETURNED',
      'TRANSFER_IN'
    ].includes(type);

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {type.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-sm text-[#5A667A] hover:text-[#1B2533] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory Stock
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2533]">Inventory History</h1>
            <p className="text-xs text-[#5A667A]">
              Immutable audit trail of all stock additions, deductions, damage, and adjustments.
            </p>
          </div>
        </div>

        <Link
          to="/inventory/adjust"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors shrink-0"
        >
          New Stock Adjustment
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9BAE]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by SKU, product, reason..."
              className="w-full pl-10 pr-3.5 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            />
          </div>

          {/* Product Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Product"
              className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Movement Type"
              className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            >
              <option value="">All Movement Types</option>
              <option value="OPENING_STOCK">Opening Stock</option>
              <option value="STOCK_IN">Stock In (Restocking)</option>
              <option value="STOCK_OUT">Stock Out (Dispatch)</option>
              <option value="ADJUSTMENT_IN">Adjustment In (Surplus)</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out (Deficit)</option>
              <option value="DAMAGED">Damaged Stock</option>
              <option value="LOST">Lost Stock</option>
              <option value="RETURNED">Customer Return</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-2 flex items-center justify-end">
            {(search || selectedProductId || selectedType || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedProductId('');
                  setSelectedType('');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#F2F5F0] text-xs text-[#5A667A]">
          <span>
            Showing <strong className="text-[#1B2533]">{history.length}</strong> of{' '}
            <strong className="text-[#1B2533]">{totalRecords}</strong> movements recorded
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* History Table & Mobile Timeline */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-[#EAEFE9] space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#EAEFE9] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center mx-auto mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[#1B2533]">No inventory history found</h3>
          <p className="text-xs text-[#5A667A] mt-1">
            No movements match your criteria. When products are restocked or adjusted, audit entries appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#EAEFE9] shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFBF8] text-[#5A667A] font-semibold text-xs border-b border-[#EAEFE9]">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Movement</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  <th className="py-3.5 px-4">Transition</th>
                  <th className="py-3.5 px-4">Reason & Ref</th>
                  <th className="py-3.5 px-4 text-right">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F5F0]">
                {history.map(m => {
                  const isPositive = [
                    'OPENING_STOCK',
                    'STOCK_IN',
                    'ADJUSTMENT_IN',
                    'RETURNED',
                    'TRANSFER_IN'
                  ].includes(m.type);

                  const dateObj = new Date(m.createdAt);
                  const dateStr = dateObj.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const prod = m.productId || { name: 'Unknown Product', sku: '---' };

                  return (
                    <tr key={m._id} className="hover:bg-[#FAFBF8] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-[#1B2533]">{dateStr}</div>
                        <div className="text-[11px] text-[#8C9BAE]">{timeStr}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/products/${prod._id}`}
                          className="font-medium text-[#1B2533] hover:text-[#69C43F] transition-colors line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                        <code className="text-[11px] font-mono text-[#8C9BAE]">{prod.sku}</code>
                      </td>
                      <td className="py-3.5 px-4">{getMovementBadge(m.type)}</td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#1B2533]">
                        <span className="text-[#8C9BAE]">{m.previousQuantity}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-[#8C9BAE]" />
                        <span className="font-bold">{m.newQuantity}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-[#1B2533] line-clamp-1">{m.reason}</div>
                        {m.reference && (
                          <span className="text-[10px] font-mono text-[#8C9BAE] bg-[#FAFBF8] px-1.5 py-0.5 rounded border border-[#EAEFE9]">
                            {m.reference}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-xs font-semibold text-[#1B2533]">
                          {m.performedBy?.name || 'Automated System'}
                        </div>
                        {m.performedBy?.role && (
                          <span className="text-[10px] uppercase font-bold text-[#8C9BAE]">
                            {m.performedBy.role}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Timeline List */}
          <div className="md:hidden space-y-3">
            {history.map(m => {
              const isPositive = [
                'OPENING_STOCK',
                'STOCK_IN',
                'ADJUSTMENT_IN',
                'RETURNED',
                'TRANSFER_IN'
              ].includes(m.type);

              const dateObj = new Date(m.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              const prod = m.productId || { name: 'Unknown Product', sku: '---' };

              return (
                <div key={m._id} className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8C9BAE]">{dateStr}</span>
                    {getMovementBadge(m.type)}
                  </div>

                  <div>
                    <Link to={`/products/${prod._id}`} className="font-semibold text-sm text-[#1B2533] block">
                      {prod.name}
                    </Link>
                    <code className="text-xs font-mono text-[#8C9BAE]">{prod.sku}</code>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFBF8] text-xs">
                    <span className="text-[#5A667A]">
                      Stock: <strong>{m.previousQuantity}</strong> → <strong>{m.newQuantity}</strong>
                    </span>
                    <span className={`font-bold text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                    </span>
                  </div>

                  <div className="text-xs text-[#5A667A] pt-1">
                    <div>Reason: {m.reason}</div>
                    <div className="text-[11px] text-[#8C9BAE] mt-0.5">By {m.performedBy?.name || 'System'}</div>
                  </div>
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
    </div>
  );
};
