import { create } from 'zustand';
import type { SystemDesignSession, Message } from '../types';

interface SystemDesignStore {
  session: SystemDesignSession | null;
  setSession: (session: SystemDesignSession | null) => void;
  addMessage: (message: Message) => void;
  setStreaming: (isStreaming: boolean) => void;
  setStage: (stage: string) => void;
  setScore: (score: any) => void;
  clearSession: () => void;
}

export const useSystemDesignStore = create<SystemDesignStore>((set) => ({
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
  setStage: (stage) =>
    set((state) => ({
      session: state.session ? { ...state.session, stage } : null,
    })),
  setScore: (score) =>
    set((state) => ({
      session: state.session ? { ...state.session, score } : null,
    })),
  clearSession: () => set({ session: null }),
}));
