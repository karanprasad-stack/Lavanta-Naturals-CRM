import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Tag, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { ProductCategory, ProductUnit } from '../../types/product';

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

export const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
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
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Quick Category creation modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    productService
      .getCategories(false)
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0]._id);
      })
      .catch(err => console.error('Failed to load categories:', err))
      .finally(() => setLoadingCats(false));
  }, []);

  // Auto-generate suggested SKU from name if empty
  const handleNameBlur = () => {
    if (!sku && name.trim()) {
      const parts = name.trim().split(/\s+/);
      const acronym = parts.map(p => p[0]?.toUpperCase()).filter(Boolean).slice(0, 3).join('');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setSku(`LAV-${acronym || 'PRD'}-${randomNum}`);
    }
  };

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSavingCat(true);
      const created = await productService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      setCategories(prev => [...prev, created]);
      setCategoryId(created._id);
      setShowCatModal(false);
      setNewCatName('');
      setNewCatDesc('');
      showToast(`Category "${created.name}" created!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    if (!sku.trim()) {
      showToast('SKU is required', 'error');
      return;
    }

    if (!categoryId) {
      showToast('Please select a category', 'error');
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
      const newProduct = await productService.createProduct({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        categoryId,
        brand: brand.trim(),
        unit,
        sellingPrice: sPrice,
        costPrice: cPrice,
        tags,
        images: imageUrl.trim() ? [imageUrl.trim()] : []
      });

      showToast(`Product "${newProduct.name}" created successfully!`, 'success');
      navigate(`/products/${newProduct._id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-[#5A667A] hover:text-[#1B2533] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2533]">Add New Product</h1>
            <p className="text-xs text-[#5A667A]">
              Register an official Lavanta Naturals SKU in the catalog.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lavender Botanical Facial Mist 100ml"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            {/* SKU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#5A667A]">SKU Code *</label>
                <span className="text-[10px] text-[#8C9BAE]">Unique SKU identifier</span>
              </div>
              <input
                type="text"
                required
                placeholder="LAV-MIS-101"
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#5A667A]">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowCatModal(true)}
                  className="text-[11px] font-medium text-[#69C43F] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              <select
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={loadingCats}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              >
                {categories.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Package Unit</label>
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

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Key botanicals, skin benefits, formulation highlights..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            2. Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8C9BAE] font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="799"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Cost Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8C9BAE] font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="320"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Media & Tags */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#1B2533] border-b border-[#F2F5F0] pb-3">
            3. Media & Product Tags
          </h2>

          <div className="space-y-4">
            {/* Image URL */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                Product Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
              />
            </div>

            {/* Tags Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#5A667A] mb-2">
                Product Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TAGS.map(tag => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

              {/* Custom Tag Input */}
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
            to="/products"
            className="px-5 py-2.5 text-sm font-medium text-[#5A667A] hover:text-[#1B2533] bg-white border border-[#EAEFE9] rounded-xl hover:bg-[#FAFBF8] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>

      {/* Quick Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEFE9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F2F5F0] pb-3">
              <h3 className="font-bold text-[#1B2533]">Create Product Category</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="text-[#8C9BAE] hover:text-[#1B2533]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aromatherapy"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A667A] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional category description"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#69C43F]/20 focus:border-[#69C43F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2F5F0]">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A667A] hover:bg-[#F2F5F0] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
                >
                  {savingCat ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
