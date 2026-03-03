import { create } from "zustand";
import { persist } from "zustand/middleware";

type ReaderMode = "single" | "longstrip" | "double";
type ReadingDirection = "ltr" | "rtl";
type ReaderBg = "white" | "dark" | "black";
type ImageFit = "width" | "height" | "original";

interface ReaderStore {
  mode: ReaderMode;
  direction: ReadingDirection;
  background: ReaderBg;
  imageFit: ImageFit;
  showToolbar: boolean;
  setMode: (m: ReaderMode) => void;
  setDirection: (d: ReadingDirection) => void;
  setBackground: (b: ReaderBg) => void;
  setImageFit: (f: ImageFit) => void;
  setShowToolbar: (s: boolean) => void;
  toggleToolbar: () => void;
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      mode: "longstrip",
      direction: "ltr",
      background: "dark",
      imageFit: "width",
      showToolbar: true,
      setMode: (mode) => set({ mode }),
      setDirection: (direction) => set({ direction }),
      setBackground: (background) => set({ background }),
      setImageFit: (imageFit) => set({ imageFit }),
      setShowToolbar: (showToolbar) => set({ showToolbar }),
      toggleToolbar: () => set((s) => ({ showToolbar: !s.showToolbar })),
    }),
    { name: "reader-settings" }
  )
);

interface SearchStore {
  recentSearches: string[];
  addSearch: (q: string) => void;
  clearSearches: () => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      recentSearches: [],
      addSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(
            0,
            10
          ),
        })),
      clearSearches: () => set({ recentSearches: [] }),
    }),
    { name: "search-history" }
  )
);
