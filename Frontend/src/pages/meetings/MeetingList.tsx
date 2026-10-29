import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ListChecks,
  Sparkles,
  Users
} from 'lucide-react';
import { Meeting, MeetingDecision } from '../../types';
import { meetingService } from '../../services/meetingService';
import { taskService } from '../../services/taskService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User } from '../../types';

export const MeetingList: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);

  // Create Meeting Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-22');
  const [time, setTime] = useState('02:00 PM');
  const [duration, setDuration] = useState('45 mins');
  const [locationOrUrl, setLocationOrUrl] = useState('Lavanta Boardroom (Studio A)');
  const [agendaText, setAgendaText] = useState('Review batch packaging; Finalize creator seed parcels');

  // Convert Decision to Task Modal
  const [convertingDecision, setConvertingDecision] = useState<{ meetingId: string; decision: MeetingDecision } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDept, setTaskDept] = useState('Operations');
  const [taskDeadline, setTaskDeadline] = useState('2026-09-26');

  useEffect(() => {
    userService.getAllUsers().then(res => {
      if (Array.isArray(res)) {
        setTeamUsers(res);
        if (res.length > 0) setTaskAssigneeId(res[0].id || (res[0] as any)._id || '');
      }
    }).catch(() => {});
  }, []);

  const loadMeetings = async () => {
    const list = await meetingService.getAllMeetings();
    setMeetings(list);
    if (list.length > 0 && !selectedMeeting) {
      setSelectedMeeting(list[0]);
    } else if (selectedMeeting) {
      const refreshed = list.find(m => m.id === selectedMeeting.id);
      if (refreshed) setSelectedMeeting(refreshed);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await meetingService.createMeeting({
      title,
      date,
      time,
      duration,
      locationOrUrl,
      participants: ['Karan Prasad', 'Rahul Kumar', 'Priya Sharma'],
      agenda: agendaText.split(';').map(s => s.trim()),
      notes: 'Meeting convened by executive leadership.',
      status: 'scheduled'
    });

    showToast(`Meeting "${title}" scheduled!`, 'success');
    setTitle('');
    setIsDrawerOpen(false);
    loadMeetings();
  };

  const handleOpenConvertToTask = (meetingId: string, dec: MeetingDecision) => {
    setConvertingDecision({ meetingId, decision: dec });
    setTaskTitle(dec.text);
  };

  const handleConfirmConvertToTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingDecision) return;

    const assignee = teamUsers.find(u => (u.id || (u as any)._id) === taskAssigneeId);
    const res = await taskService.createTask({
      title: taskTitle,
      description: `Converted directly from decision in meeting "${selectedMeeting?.title}".`,
      assignedTo: taskAssigneeId,
      priority: 'HIGH',
      deadline: new Date(taskDeadline).toISOString()
    });

    const taskId = res.task._id;
    await meetingService.markDecisionConverted(
      convertingDecision.meetingId,
      convertingDecision.decision.id,
      taskId
    );

    showToast(`Decision converted to Task #${taskId}!`, 'success');
    setConvertingDecision(null);
    loadMeetings();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)' }}>
            Meetings, Minutes & Decisions
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Transform executive alignments and formulator syncs directly into actionable tasks
          </p>
        </div>

        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
          Schedule Meeting
        </Button>
      </div>

      {/* Main Grid: Meeting List & Meeting Minutes View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Meeting Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {meetings.map(m => {
            const isSelected = selectedMeeting?.id === m.id;
            return (
              <motion.div
                key={m.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedMeeting(m)}
                className="luxury-card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-gold)' }}>
                    {m.time} • {m.duration}
                  </span>
                  <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in-progress' ? 'forest' : 'sage'}>
                    {m.status.toUpperCase()}
                  </Badge>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                  {m.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.775rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {m.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> {m.participants.length} attendees
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Selected Meeting Deep-Dive & Decision to Task */}
        {selectedMeeting && (
          <div className="luxury-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-gold)' }}>
                  Executive Session Minutes
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--color-primary)', marginTop: '2px' }}>
                  {selectedMeeting.title}
                </h2>
              </div>
              <Badge variant="forest">{selectedMeeting.status}</Badge>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {selectedMeeting.time} ({selectedMeeting.duration})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> {selectedMeeting.locationOrUrl}
              </span>
            </div>

            {/* Participants */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                Participants
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedMeeting.participants.map((p, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-soft-sage)', color: 'var(--color-deep-forest)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                Discussion Agenda
              </h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                {selectedMeeting.agenda.map((ag, i) => (
                  <li key={i}>{ag}</li>
                ))}
              </ul>
            </div>

            {/* Meeting Notes */}
            {selectedMeeting.notes && (
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Key Alignment & Takeaways
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {selectedMeeting.notes}
                </p>
              </div>
            )}

            {/* Decisions & Convert to Task (Section 37 Crucial Interaction) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <ListChecks size={18} color="var(--color-primary)" />
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Formal Decisions (Click to Convert into Assigned Tasks)
                </h4>
              </div>

              {selectedMeeting.decisions.length === 0 ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No decisions documented yet for this meeting.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedMeeting.decisions.map(dec => (
                    <div
                      key={dec.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: dec.convertedToTaskId ? 'var(--color-soft-sage)' : 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                          {dec.text}
                        </div>
                        {dec.convertedToTaskId && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '2px' }}>
                            ✓ Converted into active task (#{dec.convertedToTaskId})
                          </div>
                        )}
                      </div>

                      {!dec.convertedToTaskId ? (
                        <Button
                          variant="gold"
                          size="sm"
                          icon={<Sparkles size={14} />}
                          onClick={() => handleOpenConvertToTask(selectedMeeting.id, dec)}
                        >
                          Convert to Task
                        </Button>
                      ) : (
                        <Badge variant="success">Task Active</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Convert Decision to Task Modal */}
      <Modal
        isOpen={!!convertingDecision}
        onClose={() => setConvertingDecision(null)}
        title="Convert Decision to Actionable Task"
        subtitle="Pre-populated from executive meeting alignment"
      >
        <form onSubmit={handleConfirmConvertToTask}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select
              value={taskAssigneeId}
              onChange={e => setTaskAssigneeId(e.target.value)}
              className="form-select"
            >
              {teamUsers.map(u => (
                <option key={u.id || (u as any)._id} value={u.id || (u as any)._id}>
                  {u.name} — {u.designation} ({u.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              value={taskDept}
              onChange={e => setTaskDept(e.target.value)}
              className="form-select"
            >
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Completion Deadline</label>
            <input
              type="date"
              value={taskDeadline}
              onChange={e => setTaskDeadline(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" onClick={() => setConvertingDecision(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Task from Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Meeting Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Schedule Executive Meeting"
        subtitle="Convene leaders and define the agenda"
      >
        <form onSubmit={handleCreateMeeting}>
          <div className="form-group">
            <label className="form-label">Meeting Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Cold-Press Extraction & Logistics Sync"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Video Link</label>
            <input
              type="text"
              value={locationOrUrl}
              onChange={e => setLocationOrUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agenda (Separate with semicolon ';')</label>
            <textarea
              rows={3}
              value={agendaText}
              onChange={e => setAgendaText(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
