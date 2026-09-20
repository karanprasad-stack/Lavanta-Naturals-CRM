import { Meeting } from '../types';
import { mockMeetings } from '../data/mockData';

const STORAGE_KEY = 'lavanta_meetings';

function getStoredMeetings(): Meeting[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMeetings));
  return mockMeetings;
}

function saveMeetings(meetings: Meeting[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

export const meetingService = {
  async getAllMeetings(): Promise<Meeting[]> {
    return Promise.resolve(getStoredMeetings());
  },

  async getMeetingById(id: string): Promise<Meeting | undefined> {
    const meetings = getStoredMeetings();
    return Promise.resolve(meetings.find(m => m.id === id));
  },

  async createMeeting(newMeeting: Omit<Meeting, 'id' | 'decisions'>): Promise<Meeting> {
    const meetings = getStoredMeetings();
    const meeting: Meeting = {
      ...newMeeting,
      id: `meet-${Date.now()}`,
      decisions: []
    };
    const updated = [meeting, ...meetings];
    saveMeetings(updated);
    return Promise.resolve(meeting);
  },

  async markDecisionConverted(meetingId: string, decisionId: string, taskId: string): Promise<void> {
    const meetings = getStoredMeetings();
    const m = meetings.find(m => m.id === meetingId);
    if (m) {
      const dec = m.decisions.find(d => d.id === decisionId);
      if (dec) {
        dec.convertedToTaskId = taskId;
        saveMeetings(meetings);
      }
    }
  }
};
