import { create } from "zustand";

export interface NotesIndexChapter {
  id: string;
  name: string;
  locked?: boolean;
}

interface NotesIndexState {
  isOpen: boolean;
  chapters: NotesIndexChapter[];
  /** Set by the modal on tap, consumed once by section-notes.tsx to scroll
   * that chapter into view — decoupled via the store since the Index button
   * lives in ContentShell while the actual chapter elements render deep
   * inside SectionNotes. */
  pendingScrollToId: string | null;

  open: () => void;
  close: () => void;
  setChapters: (chapters: NotesIndexChapter[]) => void;
  jumpTo: (id: string) => void;
  clearPendingScroll: () => void;
}

export const useNotesIndexStore = create<NotesIndexState>((set) => ({
  isOpen: false,
  chapters: [],
  pendingScrollToId: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setChapters: (chapters) => set({ chapters }),
  jumpTo: (id) => set({ pendingScrollToId: id, isOpen: false }),
  clearPendingScroll: () => set({ pendingScrollToId: null }),
}));
