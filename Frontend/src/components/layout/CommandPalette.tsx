import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  CheckSquare,
  Package,
  Video,
  Lightbulb,
  Bell,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Receipt,
  DollarSign,
  Megaphone,
  Target,
  Loader2,
  X
} from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { productService } from '../../services/productService';
import { searchService } from '../../services/searchService';
import { ProductItem } from '../../types/product';

interface SearchResultItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  url: string;
  icon: React.ReactNode;
}

export const CommandPalette: React.FC = () => {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [serverResults, setServerResults] = useState<SearchResultItem[] | null>(null);
  const [realProducts, setRealProducts] = useState<ProductItem[]>([]);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      productService.getProducts({ limit: 50 }).then(res => {
        if (res?.products) setRealProducts(res.products);
      }).catch(() => {});
    }
  }, [isOpen]);

  const allItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];

    // Products (real products from database)
    if (realProducts.length > 0) {
      realProducts.forEach(p => {
        list.push({
          id: `prod-${p._id}`,
          category: 'PRODUCTS',
          title: p.name,
          subtitle: `${p.sku} • ₹${p.sellingPrice}`,
          url: `/products/${p._id}`,
          icon: <Package size={16} color="var(--color-primary)" />
        });
      });
    }

    // Navigation & Quick Actions
    list.push({
      id: 'nav-orders',
      category: 'NAVIGATION',
      title: 'Orders Management',
      subtitle: 'Track omnichannel customer orders and fulfillment',
      url: '/orders',
      icon: <ShoppingBag size={16} color="var(--color-primary)" />
    });
    list.push({
      id: 'nav-new-order',
      category: 'ACTIONS',
      title: 'Create Sales Order',
      subtitle: 'Record a new customer order with line items',
      url: '/orders/new',
      icon: <ShoppingBag size={16} color="var(--color-primary-deep)" />
    });
    list.push({
      id: 'nav-sales',
      category: 'NAVIGATION',
      title: 'Sales & Revenue Analytics',
      subtitle: 'View executive sales KPIs, trends and product rankings',
      url: '/sales',
      icon: <TrendingUp size={16} color="#16A34A" />
    });
    list.push({
      id: 'nav-expenses',
      category: 'NAVIGATION',
      title: 'Operating Expenses',
      subtitle: 'Operational expenditures and approval ledger',
      url: '/expenses',
      icon: <Receipt size={16} color="#D97706" />
    });
    list.push({
      id: 'nav-new-expense',
      category: 'ACTIONS',
      title: 'Submit Expense Claim',
      subtitle: 'Create a new reimbursement or expense request',
      url: '/expenses/new',
      icon: <Receipt size={16} color="#D97706" />
    });
    list.push({
      id: 'nav-finance',
      category: 'NAVIGATION',
      title: 'Financial Overview',
      subtitle: 'Executive revenue vs expense and net operating reporting',
      url: '/finance',
      icon: <DollarSign size={16} color="#059669" />
    });

    return list;
  }, [realProducts]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PEOPLE': return <Users size={16} color="var(--color-sage)" />;
      case 'TASKS': return <CheckSquare size={16} color="var(--color-primary)" />;
      case 'ANNOUNCEMENTS': return <Megaphone size={16} color="var(--color-warning)" />;
      case 'GOALS': return <Target size={16} color="#7C3AED" />;
      case 'PRODUCTS': return <Package size={16} color="#16A34A" />;
      case 'ORDERS': return <ShoppingBag size={16} color="#D97706" />;
      default: return <Search size={16} color="var(--color-text-secondary)" />;
    }
  };

  // Debounced backend global search (250ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setServerResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchService.globalSearch(trimmed);
        if (data && Array.isArray(data.items)) {
          const mapped: SearchResultItem[] = data.items.map(item => ({
            id: item.id,
            category: item.category,
            title: item.title,
            subtitle: item.subtitle,
            url: item.url,
            icon: getCategoryIcon(item.category)
          }));
          setServerResults(mapped);
        } else {
          setServerResults(null);
        }
      } catch (err) {
        setServerResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const localFilteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);
    const q = query.toLowerCase();
    return allItems.filter(
      item => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const displayItems = serverResults !== null ? serverResults : localFilteredItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, serverResults]);

  const handleSelect = (item: SearchResultItem) => {
    close();
    setQuery('');
    navigate(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < displayItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems[selectedIndex]) {
        handleSelect(displayItems[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="overlay-backdrop"
          onClick={close}
          style={{ alignItems: 'flex-start', paddingTop: '10vh' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="luxury-card-elevated"
            style={{ width: '100%', maxWidth: '640px', overflow: 'hidden', padding: 0 }}
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                gap: '0.75rem',
                background: 'var(--bg-surface)'
              }}
            >
              {isSearching ? (
                <div style={{ animation: 'spin 0.8s linear infinite' }}>
                  <Loader2 size={20} color="var(--color-primary)" />
                </div>
              ) : (
                <Search size={20} color="var(--color-primary)" />
              )}
              <input
                id="global-command-palette-input"
                autoFocus
                type="text"
                aria-label="Search people, tasks, products, orders, documents, goals"
                placeholder="Search people, tasks, products, orders, documents, goals..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitAppearance: 'none',
                  fontSize: '1rem',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                onClick={close}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Results List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem' }}>
              {displayItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {isSearching ? 'Searching across database...' : `No records matching "${query}"`}
                </div>
              ) : (
                displayItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--color-soft-sage)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-surface-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {item.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                borderRadius: 'var(--radius-xs)',
                                background: 'rgba(40, 75, 58, 0.08)',
                                color: 'var(--color-primary)',
                                fontWeight: 700
                              }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      {isSelected && <ArrowRight size={16} color="var(--color-primary)" />}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div
              style={{
                padding: '0.65rem 1.25rem',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.725rem',
                color: 'var(--color-text-secondary)'
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>esc Close</span>
              </div>
              <span>Lavanta Global Index</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
