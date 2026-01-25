import { create } from 'zustand';
import type { AlgorithmSession, Message } from '../types';

interface AlgorithmStore {
  session: AlgorithmSession | null;
  setSession: (session: AlgorithmSession | null) => void;
  addMessage: (message: Message) => void;
  setStreaming: (isStreaming: boolean) => void;
  setScore: (score: any) => void;
  clearSession: () => void;
}

export const useAlgorithmStore = create<AlgorithmStore>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  addMessage: (message) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, messages: [...state.session.messages, message] }
        : null,
    })),
  setStreaming: (isStreaming) =>
    set((state) => ({
      session: state.session ? { ...state.session, isStreaming } : null,
    })),
  setScore: (score) =>
    set((state) => ({
      session: state.session ? { ...state.session, score } : null,
    })),
  clearSession: () => set({ session: null }),
}));
