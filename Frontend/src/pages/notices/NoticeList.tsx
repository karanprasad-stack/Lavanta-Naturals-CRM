import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Plus, AlertCircle, Eye, Calendar, Paperclip, ChevronRight } from 'lucide-react';
import { Notice } from '../../types';
import { noticeService } from '../../services/noticeService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const NoticeList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, activeRole } = useAuth();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'important' | 'normal'>('normal');
  const [targetDepartment, setTargetDepartment] = useState('All Departments');
  const [expiryDate, setExpiryDate] = useState('2026-11-30');

  const loadNotices = async () => {
    const list = await noticeService.getAllNotices();
    setNotices(list);
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await noticeService.createNotice(
      {
        title,
        description,
        type,
        targetDepartment,
        expiryDate,
        totalTargetCount: 7,
        authorName: `${currentUser.name} (${currentUser.designation})`
      },
      currentUser.id
    );

    showToast('Company notice published!', 'success');
    setTitle('');
    setDescription('');
    setIsDrawerOpen(false);
    loadNotices();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)' }}>
            Company Notices & Circulars
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Official protocols, formulation guidelines, and dispatch advisories
          </p>
        </div>

        {/* Founder & Manager can publish */}
        {(activeRole === 'founder' || activeRole === 'manager') && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Publish Notice
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notices.map((notice, idx) => {
          const isRead = notice.readBy.includes(currentUser.id);
          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="luxury-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                borderLeft: notice.type === 'important' ? '4px solid var(--color-danger)' : '4px solid var(--color-sage)'
              }}
              onClick={() => navigate(`/notices/${notice.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant={notice.type === 'important' ? 'danger' : 'sage'}>
                    {notice.type === 'important' ? 'CRITICAL NOTICE' : 'STANDARD CIRCULAR'}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Target: {notice.targetDepartment}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={13} color="var(--color-primary)" />
                    Read by {notice.readBy.length}/{notice.totalTargetCount} members
                  </span>
                  <span>Published {notice.createdAt}</span>
                </div>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                {notice.title}
              </h3>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                {notice.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', color: 'var(--color-text-secondary)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Issued by: {notice.authorName}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  View Full Notice & Attachments <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Notice Composer Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Compose Company Notice"
        subtitle="Broadcast important instructions across departments"
      >
        <form onSubmit={handleCreateNotice}>
          <div className="form-group">
            <label className="form-label">Notice Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Operating Procedure for Rose Extract Filtration"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notice Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="form-select"
            >
              <option value="normal">Normal Circular</option>
              <option value="important">Important / Critical Advisory</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience</label>
            <select
              value={targetDepartment}
              onChange={e => setTargetDepartment(e.target.value)}
              className="form-select"
            >
              <option value="All Departments">All Departments (HQ Wide)</option>
              <option value="Marketing">Marketing & Growth</option>
              <option value="Operations & Product">Operations & Formulation</option>
              <option value="Sales">Sales & Retail</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notice Body & Details</label>
            <textarea
              rows={5}
              required
              placeholder="Write the full announcement or operating procedure..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry / Effective Until</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish Notice
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
