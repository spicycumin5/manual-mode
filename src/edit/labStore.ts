import { create } from 'zustand';

interface LabState {
  image: string | null;
  label: string;
  setImage: (src: string, label: string) => void;
}

/** Hands a shot from the simulator to the editing lab. */
export const useLab = create<LabState>((set) => ({
  image: null,
  label: '',
  setImage: (image, label) => set({ image, label }),
}));
