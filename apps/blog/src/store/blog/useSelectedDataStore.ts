import { createStore } from "@clearcut/state/create-store";

type SelectedData = {
    selectedCourse: any | null;
    selectedLevels: any | null;
    setData: (data: Partial<Pick<SelectedData, "selectedCourse" | "selectedLevels">>) => void;
    setSelectedCourse: (course: any | null) => void;
    setSelectedLevels: (levels: any | null) => void;
    reset: () => void;
};

export const useSelectedDataStore = createStore<SelectedData>("selectedDataStore", (set) => ({
    selectedCourse: null,
    selectedLevels: null,
    setData: (data) => {
        if (!data) return;
        set((state) => ({ ...state, ...data }));
    },
    setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
    setSelectedLevels: (selectedLevels) => set({ selectedLevels }),
    reset: () => set({ selectedCourse: null, selectedLevels: null }),
}));