import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckSquare,
  Megaphone,
  Target,
  FileUp,
  PackagePlus,
  ShoppingBag,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAnnouncementDrawer?: () => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onOpenAnnouncementDrawer
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  const actions = [
    {
      id: 'task',
      title: 'New Task',
      description: 'Assign a task with priority and deadline',
      icon: <CheckSquare size={20} color="#2E7D32" />,
      bg: '#E8F5E9',
      available: true,
      action: () => {
        onClose();
        navigate('/tasks');
      }
    },
    {
      id: 'announcement',
      title: 'Company Announcement',
      description: 'Broadcast urgent notice to all staff',
      icon: <Megaphone size={20} color="#0284C7" />,
      bg: '#E0F2FE',
      available: isManagement,
      action: () => {
        onClose();
        if (onOpenAnnouncementDrawer) {
          onOpenAnnouncementDrawer();
        } else {
          navigate('/announcements');
        }
      }
    },
    {
      id: 'goal',
      title: 'Strategic Goal / OKR',
      description: 'Define company or departmental objectives',
      icon: <Target size={20} color="#7C3AED" />,
      bg: '#F3E8FF',
      available: isManagement,
      action: () => {
        onClose();
        navigate('/goals');
      }
    },
    {
      id: 'document',
      title: 'Upload Document',
      description: 'Add company policy, SOP, or team resource',
      icon: <FileUp size={20} color="#0D9488" />,
      bg: '#CCFBF1',
      available: true,
      action: () => {
        onClose();
        navigate('/documents');
      }
    },
    {
      id: 'product',
      title: 'Catalog Product',
      description: 'Add new botanical formulation & initial stock',
      icon: <PackagePlus size={20} color="#15803D" />,
      bg: '#DCFCE7',
      available: isManagement,
      action: () => {
        onClose();
        navigate('/products/new');
      }
    },
    {
      id: 'order',
      title: 'Sales Order',
      description: 'Record an omnichannel customer order',
      icon: <ShoppingBag size={20} color="#B45309" />,
      bg: '#FEF3C7',
      available: isManagement,
      action: () => {
        onClose();
        navigate('/orders/new');
      }
    },
    {
      id: 'expense',
      title: 'Submit Expense Claim',
      description: 'File operational expense or reimbursement',
      icon: <Receipt size={20} color="#C2410C" />,
      bg: '#FFEDD5',
      available: true,
      action: () => {
        onClose();
        navigate('/expenses/new');
      }
    }
  ];

  const visibleActions = actions.filter(a => a.available);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="overlay-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '560px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFBF8'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Quick Create Action
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Select an entity to initialize across the workspace
                </p>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions Grid */}
            <div
              style={{
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '0.75rem',
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              {visibleActions.map(act => (
                <button
                  key={act.id}
                  onClick={act.action}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#FAFBF8';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: act.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {act.icon}
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                      {act.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
