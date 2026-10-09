import { Customer } from './customer';
import { SalesChannelType } from '../data/salesChannels';

export type SalesChannel = SalesChannelType | string;

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'REFUNDED';

export type OrderSource =
  | 'MANUAL'
  | 'CSV_IMPORT'
  | 'API'
  | 'WEBSITE'
  | 'PHONE'
  | 'SOCIAL'
  | 'OTHER';

export interface OrderItem {
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface OrderActivity {
  _id: string;
  orderId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Order {
  _id: string;
  id?: string;
  orderNumber: string; // Internal CRM Order ID (e.g. CRM-000123 / LN-2026-...)
  externalOrderId?: string | null; // Platform Order ID (e.g. Amazon: 403-..., Flipkart: OD..., Website: LVN-...)
  salesChannel: SalesChannel; // WEBSITE, AMAZON, FLIPKART, etc.
  orderDate?: string;
  customerId: Customer | string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  marketplaceFee?: number;
  grossAmount?: number;
  netAmount?: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  source: OrderSource;
  notes?: string;
  cancelReason?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  confirmedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  cancelledBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  activities?: OrderActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummaryRevenue {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export interface SalesSummaryOrders {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  recognized: number;
}

export interface SalesSummaryStatusBreakdown {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface SalesByChannelItem {
  channel: string;
  displayName: string;
  shortName: string;
  orders: number;
  units: number;
  revenue: number;
  sharePercent: number;
  avgOrderValue?: number;
  color?: string;
  bg?: string;
  badgeColor?: string;
  badgeBg?: string;
}

export interface SalesByChannelResponse {
  totalRevenue: number;
  totalOrders: number;
  totalUnits: number;
  channels: SalesByChannelItem[];
}

export interface SalesSummary {
  revenue: SalesSummaryRevenue;
  orders: SalesSummaryOrders;
  unitsSold: number;
  averageOrderValue: number;
  channelBreakdown: SalesByChannelItem[];
  statusBreakdown: SalesSummaryStatusBreakdown;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  ordersCount: number;
  itemsSold: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateOrderInput {
  salesChannel: string; // WEBSITE, AMAZON, FLIPKART, etc. (mandatory)
  externalOrderId?: string; // Platform order ID (optional for manual orders)
  orderDate?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPincode?: string;
  items: CreateOrderItemInput[];
  shippingFee?: number;
  marketplaceFee?: number;
  taxPercent?: number;
  paymentStatus?: PaymentStatus;
  orderStatus?: 'PENDING' | 'CONFIRMED';
  source?: OrderSource;
  notes?: string;
}

export interface ImportPreviewRow {
  row: number;
  status: 'VALID' | 'DUPLICATE' | 'INVALID';
  externalOrderId: string;
  salesChannel: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  shipping: number;
  marketplaceFee: number;
  total: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate?: string;
  orderStatus?: string;
  paymentStatus?: string;
  errors?: string[];
  duplicateReason?: string;
}

export interface ImportPreviewResponse {
  salesChannel: string;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  previewRows: ImportPreviewRow[];
  duplicates: { row: number; externalOrderId: string; reason: string }[];
  errors: { row: number; externalOrderId: string; errors: string[] }[];
}

export interface ImportOrdersResponse {
  salesChannel: string;
  totalProcessed: number;
  importedCount: number;
  skippedDuplicatesCount: number;
  failedCount: number;
  importedOrders: {
    _id: string;
    orderNumber: string;
    externalOrderId: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
  }[];
  skippedDuplicates: { row?: number; externalOrderId: string; reason: string }[];
  failedRows: { row?: number; externalOrderId: string; error: string }[];
}
