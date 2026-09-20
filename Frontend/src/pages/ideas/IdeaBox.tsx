import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Plus, ThumbsUp, Sparkles, CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { Idea, IdeaCategory, IdeaStatus } from '../../types';
import { ideaService } from '../../services/ideaService';
import { taskService } from '../../services/taskService';
import { Button } from '../../components/ui/Button';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const IdeaBox: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser, activeRole } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New Idea Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Product');

  const loadIdeas = async () => {
    const list = await ideaService.getAllIdeas();
    setIdeas(list);
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleUpvote = async (ideaId: string) => {
    await ideaService.upvoteIdea(ideaId);
    showToast('Upvote recorded!', 'success');
    loadIdeas();
  };

  const handleStatusUpdate = async (ideaId: string, status: IdeaStatus) => {
    await ideaService.updateIdeaStatus(ideaId, status);
    showToast(`Idea marked as ${status}`, 'info');
    loadIdeas();
  };

  const handleConvertToTask = async (idea: Idea) => {
    const res = await taskService.createTask({
      title: `[Idea Implementation] ${idea.title}`,
      description: `Originating from Idea Box by ${idea.submittedByName}: ${idea.description}`,
      assignedTo: currentUser.id,
      priority: 'HIGH',
      deadline: '2026-10-05T18:00:00.000Z'
    });

    const taskId = res.task._id;
    await ideaService.markIdeaConverted(idea.id, taskId);
    showToast(`Idea converted to Task #${taskId}!`, 'success');
    loadIdeas();
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    await ideaService.createIdea({
      title,
      description,
      category,
      submittedById: currentUser.id,
      submittedByName: currentUser.name,
      submittedByAvatar: currentUser.avatar,
      status: 'New'
    });

    showToast('Your skincare proposal has been added to Idea Box!', 'success');
    setTitle('');
    setDescription('');
    setIsDrawerOpen(false);
    loadIdeas();
  };

  const filteredIdeas = ideas.filter(
    i => categoryFilter === 'all' || i.category === categoryFilter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)' }}>
            Skincare Innovation & Idea Box
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Crowdsource rituals, sustainable packaging initiatives, and growth experiments
          </p>
        </div>

        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
          Propose Innovation
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="luxury-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['all', 'Product', 'Marketing', 'Sales', 'Website', 'Operations'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: categoryFilter === cat ? 'var(--color-primary)' : 'var(--border-color)',
              background: categoryFilter === cat ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: categoryFilter === cat ? 'var(--color-warm-white)' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            {cat === 'all' ? 'All Innovations' : cat}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredIdeas.map(idea => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="luxury-card leaf-watermark"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant="sage">{idea.category}</Badge>
                <StatusBadge status={idea.status} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-primary)', lineHeight: 1.25, marginBottom: '0.6rem' }}>
                {idea.title}
              </h3>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {idea.description}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--color-text-secondary)' }}>
                  <img src={idea.submittedByAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                  <span>{idea.submittedByName}</span>
                </div>

                <button
                  onClick={() => handleUpvote(idea.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsUp size={13} /> {idea.votes}
                </button>
              </div>

              {/* Actions: Convert to Task or Change Status */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {idea.status !== 'Implemented' && (
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<Sparkles size={13} />}
                    onClick={() => handleConvertToTask(idea)}
                  >
                    Convert to Task
                  </Button>
                )}

                {(activeRole === 'founder' || activeRole === 'manager') && idea.status === 'New' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(idea.id, 'Approved')}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Propose Idea Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Propose Innovation or Ritual"
        subtitle="Submit a concept to the Lavanta Idea Box"
      >
        <form onSubmit={handleCreateIdea}>
          <div className="form-group">
            <label className="form-label">Innovation Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Saffron & Kumkumadi Restorative Lip Oil"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="form-select"
            >
              <option value="Product">Product Formulation & Packaging</option>
              <option value="Marketing">Marketing & Influencer Campaign</option>
              <option value="Sales">Sales & Spa Distribution</option>
              <option value="Website">Website & Digital Experience</option>
              <option value="Operations">Operations & Cold-Chain</option>
              <option value="Other">Other Initiative</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Concept & Business Justification</label>
            <textarea
              rows={5}
              required
              placeholder="Why does this ritual matter to our consumers and what is the expected market response?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit to Idea Box
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
