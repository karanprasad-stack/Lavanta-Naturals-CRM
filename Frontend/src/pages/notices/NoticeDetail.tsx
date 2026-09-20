import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, ShieldCheck, Paperclip, Download } from 'lucide-react';
import { Notice } from '../../types';
import { noticeService } from '../../services/noticeService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { mockUsers } from '../../data/mockData';

export const NoticeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (id) {
      noticeService.getNoticeById(id).then(n => {
        if (n) {
          setNotice(n);
          // Auto mark read
          noticeService.markAsRead(n.id, currentUser.id);
        }
      });
    }
  }, [id, currentUser.id]);

  if (!notice) {
    return <div style={{ padding: '2rem' }}>Notice not found.</div>;
  }

  const readers = mockUsers.filter(u => notice.readBy.includes(u.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/notices')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--color-primary)',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Back to Notices
      </button>

      <div className="luxury-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', alignItems: 'center' }}>
          <Badge variant={notice.type === 'important' ? 'danger' : 'sage'}>
            {notice.type === 'important' ? 'IMPORTANT NOTICE' : 'STANDARD CIRCULAR'}
          </Badge>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {notice.targetDepartment}
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          {notice.title}
        </h1>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <span>Issued by: {notice.authorName}</span>
          <span>Published: {notice.createdAt}</span>
          <span>Valid until: {notice.expiryDate}</span>
        </div>

        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--color-text-primary)', whiteSpace: 'pre-line', marginBottom: '2rem' }}>
          {notice.description}
        </div>

        {/* Attachments */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Attached Circulars & Protocols
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notice.attachments.map((att, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} color="var(--color-sage)" />
                    <span>{att}</span>
                  </div>
                  <button
                    onClick={() => showToast(`Simulating download of ${att}`, 'info')}
                    style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Read Receipts Audit (Founder / Executive View) */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="var(--color-sage)" /> Member Read Receipts
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Read by {readers.length} of {notice.totalTargetCount} members
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {readers.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-soft-sage)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-deep-forest)'
                }}
              >
                <img src={r.avatar} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
