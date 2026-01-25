import { create } from 'zustand';

interface LoginFormState {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
}

export const useLoginFormStore = create<LoginFormState>((set) => ({
  email: '',
  password: '',

  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
}));

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
}

export const useRegisterFormStore = create<RegisterFormState>((set) => ({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',

  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
}));
