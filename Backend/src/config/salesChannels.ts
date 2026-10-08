/**
 * Canonical Sales Channels for Lavanta Naturals
 * External operational systems (Website Admin, Amazon Seller Central, Flipkart Seller Hub)
 * process orders independently. The CRM consolidates their business and sales metrics.
 */

export const SALES_CHANNELS = ['WEBSITE', 'AMAZON', 'FLIPKART', 'INSTAGRAM', 'OFFLINE', 'DISTRIBUTOR', 'WHOLESALE', 'MEESHO', 'OTHER'] as const;

export type SalesChannelType = typeof SALES_CHANNELS[number];

export interface ChannelMeta {
  code: SalesChannelType;
  displayName: string;
  shortName: string;
  defaultPrefix: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
}

export const SALES_CHANNEL_CONFIGS: Record<SalesChannelType, ChannelMeta> = {
  WEBSITE: {
    code: 'WEBSITE',
    displayName: 'Lavanta Website',
    shortName: 'Website',
    defaultPrefix: 'LVN-',
    badgeBg: '#E8F5E9',
    badgeColor: '#166534',
    description: 'Direct customer sales via official Lavanta Naturals e-commerce storefront'
  },
  AMAZON: {
    code: 'AMAZON',
    displayName: 'Amazon',
    shortName: 'Amazon',
    defaultPrefix: '403-',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    description: 'Amazon Marketplace seller orders'
  },
  FLIPKART: {
    code: 'FLIPKART',
    displayName: 'Flipkart',
    shortName: 'Flipkart',
    defaultPrefix: 'OD',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    description: 'Flipkart Marketplace seller orders'
  },
  INSTAGRAM: {
    code: 'INSTAGRAM',
    displayName: 'Instagram',
    shortName: 'Instagram',
    defaultPrefix: 'IG-',
    badgeBg: '#FCE7F3',
    badgeColor: '#9D174D',
    description: 'Social direct orders via Instagram DM'
  },
  OFFLINE: {
    code: 'OFFLINE',
    displayName: 'Offline / Retail',
    shortName: 'Offline',
    defaultPrefix: 'RET-',
    badgeBg: '#F3F4F6',
    badgeColor: '#374151',
    description: 'In-person store or wellness exhibit sales'
  },
  DISTRIBUTOR: {
    code: 'DISTRIBUTOR',
    displayName: 'Distributor',
    shortName: 'Distributor',
    defaultPrefix: 'DIS-',
    badgeBg: '#EDE9FE',
    badgeColor: '#6B21A8',
    description: 'Regional beauty and wellness distributor channels'
  },
  WHOLESALE: {
    code: 'WHOLESALE',
    displayName: 'Wholesale / Salon',
    shortName: 'Wholesale',
    defaultPrefix: 'WS-',
    badgeBg: '#CCFBF1',
    badgeColor: '#115E59',
    description: 'B2B luxury salon and spa bulk purchase contracts'
  },
  MEESHO: {
    code: 'MEESHO',
    displayName: 'Meesho',
    shortName: 'Meesho',
    defaultPrefix: 'MSH-',
    badgeBg: '#FDF2F8',
    badgeColor: '#831843',
    description: 'Meesho seller orders'
  },
  OTHER: {
    code: 'OTHER',
    displayName: 'Other Channel',
    shortName: 'Other',
    defaultPrefix: 'OTH-',
    badgeBg: '#F3F4F6',
    badgeColor: '#4B5563',
    description: 'Other sales channels'
  }
};

/**
 * Valid expense channels
 */
export const EXPENSE_CHANNELS = ['GENERAL', 'WEBSITE', 'AMAZON', 'FLIPKART', 'OTHER'] as const;
export type ExpenseChannelType = typeof EXPENSE_CHANNELS[number];
