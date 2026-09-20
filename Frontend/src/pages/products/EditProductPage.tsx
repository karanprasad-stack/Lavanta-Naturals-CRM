import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Lock, AlertCircle, Tag, Check, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { ProductCategory, ProductUnit } from '../../types/inventory';

const UNITS: ProductUnit[] = [
  'PIECE',
  'BOTTLE',
  'BOX',
  'PACK',
  'GRAM',
  'KG',
  'ML',
  'LITRE',
  'OTHER'
];

const PRESET_TAGS = ['Best Seller', 'New', 'Seasonal', 'Gift', 'Featured', 'Organic', 'Ayurvedic'];

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('Lavanta Naturals');
  const [unit, setUnit] = useState<ProductUnit>('PIECE');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [cats, prodData] = await Promise.all([
          productService.getCategories(false),
          productService.getProductById(id)
        ]);
        setCategories(cats);

        const prod = prodData.product;
        setName(prod.name);
        setSku(prod.sku);
        setDescription(prod.description || '');
        setCategoryId(
          typeof prod.categoryId === 'object' && prod.categoryId ? prod.categoryId._id : (prod.categoryId as string)
        );
        setBrand(prod.brand || 'Lavanta Naturals');
        setUnit(prod.unit || 'PIECE');
        setSellingPrice(prod.sellingPrice?.toString() || '0');
        setCostPrice(prod.costPrice?.toString() || '0');
        setCurrentStock(prod.stockQuantity);
        setLowStockThreshold(prod.lowStockThreshold || 10);
        setTags(prod.tags || []);
        setImageUrl(prod.images?.[0] || '');
        setStatus(prod.status as any);
      } catch (err: any) {
        showToast(err.message || 'Failed to load product for editing', 'error');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      if (!tags.includes(customTag.trim())) {
        setTags([...tags, customTag.trim()]);
      }
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    const sPrice = parseFloat(sellingPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      showToast('Selling price must be >= 0', 'error');
      return;
    }

    const cPrice = costPrice ? parseFloat(costPrice) : 0;
    if (isNaN(cPrice) || cPrice < 0) {
      showToast('Cost price must be >= 0', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await productService.updateProduct(id, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        categoryId,
        brand: brand.trim(),
        unit,
        sellingPrice: sPrice,
        costPrice: cPrice,
        lowStockThreshold: Math.max(0, lowStockThreshold),
        tags,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        status
      });

      showToast('Product updated successfully!', 'success');
      navigate(`/products/${id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="bg-white p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-4 animate-pulse">
          <div className="w-48 h-6 bg-gray-200 rounded"></div>
          <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to={`/products/${id}`}
          className="inline-flex items-center gap-2 text-sm text-[#5A667A] hover:text-[#1B2533] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Product Details
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2533]">Edit Product</h1>
            <p className="text-xs text-[#5A667A]">Update product specifications and pricing.</p>
          </div>
        </div>
      </div>

      {/* Audit Protection Notice regarding Stock */}
      <div className="bg-[#FAFBF8] p-4 rounded-2xl border border-[#EAEFE9] flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#1B2533]">Stock Modification Policy</h4>
          <p className="text-xs text-[#5A667A]">
            Current stock is locked to <strong>{currentStock} {unit.toLowerCase()}s</strong>. Direct stock quantity
            editing is strictly disabled to preserve inventory audit trails. To change stock levels, please use{' '}
            <Link
              to={`/inventory/adjust?productId=${id}`}
              className="text-[#69C43F] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Stock Adjustment <Layers className="w-3 h-3" />
            </Link>.
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            Core Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              >
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Inventory Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Threshold */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            Pricing & Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Low-Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Media & Tags */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            Media & Tags
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TAGS.map(tag => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-[#69C43F] text-white'
                          : 'bg-[#FAFBF8] text-[#5A667A] border border-[#EAEFE9] hover:bg-[#F2F5F0]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Type custom tag and press Enter..."
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={addCustomTag}
                className="w-full sm:w-72 px-3 py-1.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={`/products/${id}`}
            className="px-5 py-2.5 text-sm font-medium text-[#5A667A] hover:text-[#1B2533] bg-white border border-[#EAEFE9] rounded-xl hover:bg-[#FAFBF8] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
