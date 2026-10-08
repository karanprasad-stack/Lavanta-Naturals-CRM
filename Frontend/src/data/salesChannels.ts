/**
 * Canonical Sales Channels Definition for Lavanta Naturals CRM
 * Consolidates multi-channel orders without managing external marketplace operations.
 */

export type SalesChannelType =
  | 'WEBSITE'
  | 'AMAZON'
  | 'FLIPKART'
  | 'INSTAGRAM'
  | 'OFFLINE'
  | 'DISTRIBUTOR'
  | 'WHOLESALE'
  | 'MEESHO'
  | 'OTHER';

export interface ChannelConfig {
  code: SalesChannelType;
  name: string;
  displayName: string;
  shortName: string;
  defaultPrefix: string;
  color: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  tagColor: string;
  description: string;
}

export const SALES_CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  WEBSITE: {
    code: 'WEBSITE',
    name: 'Lavanta Website',
    displayName: 'Lavanta Website',
    shortName: 'Website',
    defaultPrefix: 'LVN-',
    color: '#2E7D32',
    badgeBg: 'rgba(105, 196, 63, 0.12)',
    badgeColor: '#2E7D32',
    badgeBorder: 'rgba(105, 196, 63, 0.3)',
    tagColor: '#2E7D32',
    description: 'Direct customer e-commerce orders via lavantanaturals.com'
  },
  AMAZON: {
    code: 'AMAZON',
    name: 'Amazon',
    displayName: 'Amazon',
    shortName: 'Amazon',
    defaultPrefix: '403-',
    color: '#D97706',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeColor: '#B45309',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    tagColor: '#D97706',
    description: 'Amazon Marketplace seller orders'
  },
  FLIPKART: {
    code: 'FLIPKART',
    name: 'Flipkart',
    displayName: 'Flipkart',
    shortName: 'Flipkart',
    defaultPrefix: 'OD',
    color: '#2563EB',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeColor: '#1E40AF',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
    tagColor: '#2563EB',
    description: 'Flipkart Marketplace seller orders'
  },
  INSTAGRAM: {
    code: 'INSTAGRAM',
    name: 'Instagram',
    displayName: 'Instagram',
    shortName: 'Instagram',
    defaultPrefix: 'IG-',
    color: '#DB2777',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    badgeColor: '#9D174D',
    badgeBorder: 'rgba(236, 72, 153, 0.3)',
    tagColor: '#DB2777',
    description: 'Direct social commerce orders via Instagram DM'
  },
  OFFLINE: {
    code: 'OFFLINE',
    name: 'Offline / Retail',
    displayName: 'Offline / Retail',
    shortName: 'Offline',
    defaultPrefix: 'RET-',
    color: '#4B5563',
    badgeBg: 'rgba(107, 114, 128, 0.12)',
    badgeColor: '#374151',
    badgeBorder: 'rgba(107, 114, 128, 0.3)',
    tagColor: '#4B5563',
    description: 'Physical storefront, popup, or wellness boutique sales'
  },
  DISTRIBUTOR: {
    code: 'DISTRIBUTOR',
    name: 'Distributor',
    displayName: 'Distributor',
    shortName: 'Distributor',
    defaultPrefix: 'DIS-',
    color: '#7C3AED',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeColor: '#6B21A8',
    badgeBorder: 'rgba(139, 92, 246, 0.3)',
    tagColor: '#7C3AED',
    description: 'Regional beauty and wellness distributors'
  },
  WHOLESALE: {
    code: 'WHOLESALE',
    name: 'Wholesale / Salon',
    displayName: 'Wholesale / Salon',
    shortName: 'Wholesale',
    defaultPrefix: 'WS-',
    color: '#0D9488',
    badgeBg: 'rgba(20, 184, 166, 0.12)',
    badgeColor: '#0F766E',
    badgeBorder: 'rgba(20, 184, 166, 0.3)',
    tagColor: '#0D9488',
    description: 'B2B luxury Ayurvedic salon contracts'
  },
  MEESHO: {
    code: 'MEESHO',
    name: 'Meesho',
    displayName: 'Meesho',
    shortName: 'Meesho',
    defaultPrefix: 'MSH-',
    color: '#E11D48',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    badgeColor: '#9F1239',
    badgeBorder: 'rgba(244, 63, 94, 0.3)',
    tagColor: '#E11D48',
    description: 'Meesho seller orders'
  },
  OTHER: {
    code: 'OTHER',
    name: 'Other Channel',
    displayName: 'Other Channel',
    shortName: 'Other',
    defaultPrefix: 'OTH-',
    color: '#6B7280',
    badgeBg: 'rgba(156, 163, 175, 0.12)',
    badgeColor: '#4B5563',
    badgeBorder: 'rgba(156, 163, 175, 0.3)',
    tagColor: '#6B7280',
    description: 'Other sales channels'
  }
};

export type SalesChannel = SalesChannelType;
export const SALES_CHANNELS: ChannelConfig[] = Object.values(SALES_CHANNEL_CONFIGS);

/**
 * Helper to get channel metadata safely
 */
export function getChannelMeta(channel?: string): ChannelConfig {
  const key = (channel || 'WEBSITE').toUpperCase();
  return (
    SALES_CHANNEL_CONFIGS[key] || {
      code: 'OTHER',
      name: channel || 'Other',
      displayName: channel || 'Other',
      shortName: channel || 'Other',
      defaultPrefix: 'ORD-',
      color: '#6B7280',
      badgeBg: 'rgba(156, 163, 175, 0.12)',
      badgeColor: '#4B5563',
      badgeBorder: 'rgba(156, 163, 175, 0.3)',
      tagColor: '#6B7280',
      description: 'Sales channel'
    }
  );
}

export const INITIAL_CHANNELS: SalesChannelType[] = ['WEBSITE', 'AMAZON', 'FLIPKART'];
