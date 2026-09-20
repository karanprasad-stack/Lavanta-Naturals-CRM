import React, { useState, useEffect, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Tag,
  Eye,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { ProductItem, ProductCategory, StockStatusType } from '../../types/inventory';

export const ProductsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isPending = false;
  const [, startTransition] = useTransition();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const canManageProducts = ['FOUNDER', 'MANAGER'].includes(userRole);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockStatusType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | ''>('ACTIVE');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch categories once
  useEffect(() => {
    productService
      .getCategories(true)
      .then(cats => setCategories(cats))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({
        search: debouncedSearch,
        category: selectedCategory,
        stockStatus: selectedStockStatus,
        status: selectedStatus,
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      });
      setProducts(res.products);
      setTotalProducts(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, selectedCategory, selectedStockStatus, selectedStatus, currentPage, sortBy, sortOrder]);

  const getStockBadge = (product: ProductItem) => {
    const status = product.stockStatus || (product.stockQuantity === 0 ? 'OUT_OF_STOCK' : product.stockQuantity <= product.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK');

    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            In Stock ({product.stockQuantity})
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Low Stock ({product.stockQuantity})
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAEFE9] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9ED] flex items-center justify-center text-[#69C43F]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1B2533]">Products</h1>
              <p className="text-sm text-[#5A667A]">Manage Lavanta Naturals products and inventory.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B2533] bg-[#F7F9F6] hover:bg-[#EEF3ED] border border-[#EAEFE9] rounded-xl transition-colors"
          >
            <Layers className="w-4 h-4 text-[#69C43F]" />
            Inventory Stock
          </Link>
          {canManageProducts && (
            <Link
              to="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9BAE]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name, SKU, brand, tags..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F] transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
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
                  {c.name} {c.productCount ? `(${c.productCount})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStockStatus}
              onChange={e => {
                setSelectedStockStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              aria-label="Filter by Stock Status"
              className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            >
              <option value="">All Stock Levels</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Catalog Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              aria-label="Filter by Catalog Status"
              className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-[#5A667A] border-t border-[#F2F5F0]">
          <span>
            Showing <strong className="text-[#1B2533]">{products.length}</strong> of{' '}
            <strong className="text-[#1B2533]">{totalProducts}</strong> products
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
              }}
              className="inline-flex items-center gap-1 hover:text-[#1B2533] transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Order: {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Product List Content */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-[#FAFBF8] rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="w-48 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#EAEFE9] text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B2533]">No products found</h3>
          <p className="text-sm text-[#5A667A] mt-1 max-w-sm mx-auto">
            {search || selectedCategory || selectedStockStatus
              ? 'No products match your current filters. Try resetting search or category parameters.'
              : 'Your product catalog is empty. Create your first product to start tracking inventory.'}
          </p>
          {canManageProducts && (
            <Link
              to="/products/new"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
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
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4">Stock Level</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F5F0]">
                {products.map(p => {
                  const catName = typeof p.categoryId === 'object' && p.categoryId ? p.categoryId.name : 'Uncategorized';
                  const thumbnail = p.images?.[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&auto=format&fit=crop&q=80';

                  return (
                    <tr key={p._id} className="hover:bg-[#FAFBF8] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover border border-[#EAEFE9] bg-white shrink-0"
                            onError={e => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <Link
                              to={`/products/${p._id}`}
                              className="font-medium text-[#1B2533] hover:text-[#69C43F] transition-colors line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <span className="text-xs text-[#8C9BAE]">{p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <code className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[#F4F6F3] text-[#2D3748]">
                          {p.sku}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-[#5A667A] px-2 py-0.5 rounded-md bg-[#FAFBF8] border border-[#EAEFE9]">
                          <Tag className="w-3 h-3 text-[#69C43F]" />
                          {catName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#1B2533]">
                        ₹{p.sellingPrice?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div>{getStockBadge(p)}</div>
                          <div className="text-[11px] text-[#8C9BAE]">
                            Threshold: {p.lowStockThreshold} {p.unit.toLowerCase()}s
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'ARCHIVED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/products/${p._id}`}
                            className="p-1.5 text-[#5A667A] hover:text-[#1B2533] hover:bg-[#F2F5F0] rounded-lg transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canManageProducts && (
                            <Link
                              to={`/products/${p._id}/edit`}
                              className="p-1.5 text-[#5A667A] hover:text-[#69C43F] hover:bg-[#F0F9ED] rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
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
            {products.map(p => {
              const catName = typeof p.categoryId === 'object' && p.categoryId ? p.categoryId.name : 'Uncategorized';
              const thumbnail = p.images?.[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&auto=format&fit=crop&q=80';

              return (
                <div
                  key={p._id}
                  className="bg-white p-4 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={thumbnail}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#EAEFE9] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-[#F4F6F3] text-[#2D3748]">
                          {p.sku}
                        </code>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'ARCHIVED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <Link
                        to={`/products/${p._id}`}
                        className="font-semibold text-sm text-[#1B2533] mt-1 block truncate"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-[#5A667A] mt-0.5">{catName}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F2F5F0]">
                    <div>{getStockBadge(p)}</div>
                    <div className="text-right">
                      <span className="text-base font-bold text-[#1B2533]">
                        ₹{p.sellingPrice?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/products/${p._id}`}
                      className="flex-1 py-1.5 text-center text-xs font-medium text-[#1B2533] bg-[#F7F9F6] border border-[#EAEFE9] rounded-xl hover:bg-[#EEF3ED]"
                    >
                      View Details
                    </Link>
                    {canManageProducts && (
                      <Link
                        to={`/products/${p._id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium text-[#69C43F] bg-[#F0F9ED] border border-[#D5EED0] rounded-xl hover:bg-[#E3F5DE]"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-[#EAEFE9] text-sm">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EAEFE9] text-[#1B2533] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAFBF8]"
              >
                Previous
              </button>
              <span className="text-xs text-[#5A667A]">
                Page <strong className="text-[#1B2533]">{currentPage}</strong> of{' '}
                <strong className="text-[#1B2533]">{totalPages}</strong>
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EAEFE9] text-[#1B2533] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAFBF8]"
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
