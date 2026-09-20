import { Idea, IdeaStatus } from '../types';
import { mockIdeas } from '../data/mockData';

const STORAGE_KEY = 'lavanta_ideas';

function getStoredIdeas(): Idea[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockIdeas));
  return mockIdeas;
}

function saveIdeas(ideas: Idea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export const ideaService = {
  async getAllIdeas(): Promise<Idea[]> {
    return Promise.resolve(getStoredIdeas());
  },

  async updateIdeaStatus(id: string, status: IdeaStatus): Promise<Idea> {
    const ideas = getStoredIdeas();
    const index = ideas.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Idea not found');

    ideas[index] = { ...ideas[index], status };
    saveIdeas(ideas);
    return Promise.resolve(ideas[index]);
  },

  async upvoteIdea(id: string): Promise<Idea> {
    const ideas = getStoredIdeas();
    const index = ideas.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Idea not found');

    ideas[index] = { ...ideas[index], votes: ideas[index].votes + 1 };
    saveIdeas(ideas);
    return Promise.resolve(ideas[index]);
  },

  async createIdea(newIdea: Omit<Idea, 'id' | 'votes' | 'createdAt'>): Promise<Idea> {
    const ideas = getStoredIdeas();
    const idea: Idea = {
      ...newIdea,
      id: `idea-${Date.now()}`,
      votes: 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [idea, ...ideas];
    saveIdeas(updated);
    return Promise.resolve(idea);
  },

  async markIdeaConverted(id: string, taskId: string): Promise<void> {
    const ideas = getStoredIdeas();
    const index = ideas.findIndex(i => i.id === id);
    if (index !== -1) {
      ideas[index].convertedToTaskId = taskId;
      ideas[index].status = 'Implemented';
      saveIdeas(ideas);
    }
  }
};
