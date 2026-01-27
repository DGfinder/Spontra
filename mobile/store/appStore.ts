import { create } from 'zustand';
import { Theme, ThemeSlug, Destination, ContentItem } from '../types';

export const THEMES: Theme[] = [
  {
    id: 'adventure',
    name: 'Adventure',
    emoji: '🏔️',
    description: 'Hiking, extreme sports, exploring',
    gradient: ['#f97316', '#dc2626'],
  },
  {
    id: 'nature',
    name: 'Nature',
    emoji: '🌿',
    description: 'Beaches, mountains, wilderness',
    gradient: ['#22c55e', '#14b8a6'],
  },
  {
    id: 'vibe',
    name: 'Vibe',
    emoji: '🎉',
    description: 'Nightlife, social, parties',
    gradient: ['#a855f7', '#ec4899'],
  },
  {
    id: 'indulge',
    name: 'Indulge',
    emoji: '✨',
    description: 'Luxury, shopping, spa',
    gradient: ['#f59e0b', '#eab308'],
  },
  {
    id: 'discover',
    name: 'Discover',
    emoji: '📚',
    description: 'Culture, food, history',
    gradient: ['#3b82f6', '#6366f1'],
  },
];

interface AppState {
  // User preferences
  originAirport: string | null;
  maxFlightMinutes: number;
  selectedTheme: ThemeSlug | null;
  
  // Content
  feedContent: ContentItem[];
  currentIndex: number;
  isLoading: boolean;
  
  // Selected destination
  selectedDestination: Destination | null;
  
  // Actions
  setOriginAirport: (airport: string) => void;
  setMaxFlightMinutes: (minutes: number) => void;
  setSelectedTheme: (theme: ThemeSlug | null) => void;
  setFeedContent: (content: ContentItem[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedDestination: (destination: Destination | null) => void;
  reset: () => void;
}

const initialState = {
  originAirport: null,
  maxFlightMinutes: 180, // 3 hours default
  selectedTheme: null,
  feedContent: [],
  currentIndex: 0,
  isLoading: false,
  selectedDestination: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  setOriginAirport: (airport) => set({ originAirport: airport }),
  setMaxFlightMinutes: (minutes) => set({ maxFlightMinutes: minutes }),
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),
  setFeedContent: (content) => set({ feedContent: content }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedDestination: (destination) => set({ selectedDestination: destination }),
  reset: () => set(initialState),
}));
