import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, AlertTriangle, XCircle, ArrowRight, Package } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { InventorySummaryStats, ProductItem } from '../../types/inventory';

export const InventoryWidget: React.FC = () => {
  const [summary, setSummary] = useState<InventorySummaryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sum, low] = await Promise.all([
          inventoryService.getSummary(),
          inventoryService.getLowStock()
        ]);
        setSummary(sum);
        setLowStockProducts(low.slice(0, 3));
      } catch (err) {
        console.error('Failed to load inventory widget data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-3 animate-pulse">
        <div className="w-28 h-5 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 bg-gray-100 rounded-xl"></div>
          <div className="h-14 bg-gray-100 rounded-xl"></div>
          <div className="h-14 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#1B2533]">Inventory Overview</h3>
        </div>
        <Link
          to="/inventory"
          className="text-xs font-semibold text-[#69C43F] hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-[#FAFBF8] border border-[#EAEFE9]">
          <span className="text-[10px] text-[#8C9BAE] uppercase font-bold block">Products</span>
          <span className="text-base font-extrabold text-[#1B2533]">{summary.totalProducts}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] text-amber-700 uppercase font-bold block">Low Stock</span>
          <span className="text-base font-extrabold text-amber-600">{summary.lowStock}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60">
          <span className="text-[10px] text-rose-700 uppercase font-bold block">Out of Stock</span>
          <span className="text-base font-extrabold text-rose-600">{summary.outOfStock}</span>
        </div>
      </div>

      {/* Low Stock Items List */}
      {lowStockProducts.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-[#5A667A] block">Requires Attention</span>
          {lowStockProducts.map(p => (
            <div
              key={p._id}
              className="p-2 rounded-xl bg-[#FAFBF8] border border-[#EAEFE9] flex items-center justify-between text-xs"
            >
              <div className="min-w-0 flex-1 pr-2">
                <Link
                  to={`/products/${p._id}`}
                  className="font-medium text-[#1B2533] hover:text-[#69C43F] truncate block"
                >
                  {p.name}
                </Link>
                <span className="text-[10px] text-[#8C9BAE]">SKU: {p.sku}</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  p.stockQuantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {p.stockQuantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
