import { Customer } from './customer';

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
  | 'WEBSITE'
  | 'MANUAL'
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
  orderNumber: string;
  customerId: Customer | string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  source: OrderSource;
  notes?: string;
  cancelReason?: string;
  inventoryDeducted: boolean;
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

export interface SalesSummary {
  revenue: SalesSummaryRevenue;
  orders: SalesSummaryOrders;
  averageOrderValue: number;
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
  taxPercent?: number;
  paymentStatus?: PaymentStatus;
  orderStatus?: 'PENDING' | 'CONFIRMED';
  source?: OrderSource;
  notes?: string;
}
