import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { inventoryService } from '../../services/inventoryService';
import {
  InventorySummaryStats,
  ProductItem,
  InventoryTrendPoint,
  InventoryMovementItem
} from '../../types/inventory';

export const InventoryDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<InventorySummaryStats>({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
    inStock: 0
  });
  const [lowStockList, setLowStockList] = useState<ProductItem[]>([]);
  const [trends, setTrends] = useState<InventoryTrendPoint[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovementItem[]>([]);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [sum, low, trendData, historyData] = await Promise.all([
          inventoryService.getSummary(),
          inventoryService.getLowStock(),
          inventoryService.getTrends(timeRange),
          inventoryService.getHistory({ limit: 6 })
        ]);

        setSummary(sum);
        setLowStockList(low);
        setTrends(trendData);
        setRecentMovements(historyData.history || []);
      } catch (err) {
        console.error('Failed to load inventory dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [timeRange]);

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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F9ED] text-[#69C43F] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2533]">Inventory Dashboard & Trends</h1>
            <p className="text-xs text-[#5A667A]">Stock velocity, replenishments, and low-stock alarms.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/adjust"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#69C43F] hover:bg-[#5BAE37] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Stock Adjustment
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs">
          <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Total Products</span>
          <div className="text-2xl font-extrabold text-[#1B2533] mt-1">{summary.totalProducts}</div>
          <span className="text-[11px] text-[#5A667A] mt-0.5 block">{summary.inStock} Healthy</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs">
          <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Total Units in Stock</span>
          <div className="text-2xl font-extrabold text-[#9333EA] mt-1">
            {summary.totalUnits?.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#5A667A] mt-0.5 block">Across all warehouses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs">
          <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Low Stock</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{summary.lowStock}</div>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Below safety threshold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAEFE9] shadow-xs">
          <span className="text-xs text-[#8C9BAE] uppercase font-bold tracking-wider">Out of Stock</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{summary.outOfStock}</div>
          <span className="text-[11px] text-rose-700 mt-0.5 block">Immediate restocking needed</span>
        </div>
      </div>

      {/* Stock Movement Trends (Recharts) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1B2533]">Stock Movement Trends</h2>
            <p className="text-xs text-[#5A667A]">Stock In (Restocking) vs Stock Out (Dispatches)</p>
          </div>

          {/* Time Range Toggle */}
          <div className="inline-flex items-center p-1 bg-[#FAFBF8] border border-[#EAEFE9] rounded-xl self-start sm:self-auto">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  timeRange === days
                    ? 'bg-white text-[#1B2533] shadow-xs font-bold'
                    : 'text-[#5A667A] hover:text-[#1B2533]'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-72 w-full pt-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFBF8] rounded-2xl animate-pulse">
              <span className="text-xs text-[#8C9BAE]">Loading movement trends...</span>
            </div>
          ) : trends.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFBF8] rounded-2xl text-xs text-[#5A667A]">
              No inventory movements recorded in the last {timeRange} days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F5F0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => {
                    const parts = d.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                  tick={{ fontSize: 11, fill: '#8C9BAE' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAEFE9' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8C9BAE' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAEFE9' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#EAEFE9',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                  labelFormatter={label => `Date: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar dataKey="stockIn" name="Stock In (+)" fill="#69C43F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out (-)" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Low Stock Alert Products & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Watchlist */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2533] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Watchlist ({lowStockList.length})
            </h2>
            <Link to="/inventory" className="text-xs text-[#69C43F] font-semibold hover:underline">
              View All
            </Link>
          </div>

          {lowStockList.length === 0 ? (
            <div className="py-8 text-center bg-[#FAFBF8] rounded-2xl border border-dashed border-[#EAEFE9] text-xs text-[#5A667A]">
              🎉 Excellent! No products are currently below threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockList.map(p => {
                const isOut = p.stockQuantity === 0;
                return (
                  <div
                    key={p._id}
                    className="p-3.5 rounded-2xl border border-[#EAEFE9] bg-[#FAFBF8] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${p._id}`}
                        className="text-xs font-bold text-[#1B2533] hover:text-[#69C43F] truncate block"
                      >
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-[#8C9BAE] mt-0.5">
                        SKU: {p.sku} • Threshold: {p.lowStockThreshold} {p.unit.toLowerCase()}s
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          isOut ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.stockQuantity} {p.unit.toLowerCase()}s left
                      </span>
                      <div>
                        <Link
                          to={`/inventory/adjust?productId=${p._id}`}
                          className="text-[11px] font-semibold text-[#69C43F] hover:underline block"
                        >
                          Restock →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Movement Activity */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#EAEFE9] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2533] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#69C43F]" />
              Recent Inventory Activity
            </h2>
            <Link to="/inventory/history" className="text-xs text-[#69C43F] font-semibold hover:underline">
              Full History
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center bg-[#FAFBF8] rounded-2xl border border-dashed border-[#EAEFE9] text-xs text-[#5A667A]">
              No recent movements logged.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map(m => {
                const isPositive = [
                  'OPENING_STOCK',
                  'STOCK_IN',
                  'ADJUSTMENT_IN',
                  'RETURNED',
                  'TRANSFER_IN'
                ].includes(m.type);

                const prod = m.productId || { name: 'Product', sku: '---' };

                return (
                  <div
                    key={m._id}
                    className="p-3 rounded-xl border border-[#EAEFE9] bg-[#FAFBF8] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#1B2533] truncate">{prod.name}</div>
                      <div className="text-[11px] text-[#5A667A] mt-0.5">
                        {m.type.replace(/_/g, ' ')} • {m.reason}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                      <div className="text-[10px] text-[#8C9BAE]">
                        {m.previousQuantity} → {m.newQuantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
