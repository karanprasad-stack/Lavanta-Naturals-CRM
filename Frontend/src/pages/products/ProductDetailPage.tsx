import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Edit3,
  FileText,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { ProductItem } from '../../types/product';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const canManage = ['FOUNDER', 'MANAGER'].includes(userRole);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await productService.getProductById(id);
      setProduct(data.product);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;

    try {
      const res = await productService.deleteProduct(product._id);
      showToast(res.message || 'Product deleted successfully', 'success');
      navigate('/products');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
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
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Product
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

          {/* Product Info */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F3] text-[#1B2533] border border-[#EAEFE9]">
                  SKU: {product.sku}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#F0F9ED] text-[#69C43F] border border-[#D5EED0]">
                  {catName}
                </span>
                {product.brand && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#FAFBF8] text-[#5A667A] border border-[#EAEFE9]">
                    Brand: {product.brand}
                  </span>
                )}
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#FAFBF8] text-[#5A667A] border border-[#EAEFE9]">
                  Unit: {product.unit}
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

            {/* Pricing Box */}
            <div className="bg-[#FAFBF8] p-5 rounded-2xl border border-[#EAEFE9] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-[#8C9BAE] block uppercase tracking-wider font-semibold">Selling Price</span>
                <div className="text-2xl font-extrabold text-[#1B2533] mt-1">
                  ₹{product.sellingPrice?.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span className="text-xs text-[#8C9BAE] block uppercase tracking-wider font-semibold">Cost Price</span>
                <div className="text-2xl font-extrabold text-[#5A667A] mt-1">
                  {product.costPrice > 0 ? `₹${product.costPrice?.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Documents Section */}
      {product.documentIds && product.documentIds.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2533] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#69C43F]" />
              Linked Documentation & Specifications ({product.documentIds.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {product.documentIds.map((doc: any) => (
              <div
                key={doc._id}
                className="p-3.5 rounded-xl border border-[#EAEFE9] bg-[#FAFBF8] flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EAEFE9] flex items-center justify-center text-[#69C43F] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1B2533] truncate">{doc.title}</div>
                  <div className="text-[11px] text-[#8C9BAE] uppercase">{doc.fileType || 'DOC'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
