import { describe, expect, it } from "vitest";
import { createStore } from "./create-store";

type CounterState = {
  count: number;
  increment: () => void;
};

describe("createStore", () => {
  it("produces a working zustand store with the given initial state", () => {
    const useCounter = createStore<CounterState>("counterStore", (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    expect(useCounter.getState().count).toBe(0);
  });

  it("applies state updates via actions defined in the initializer", () => {
    const useCounter = createStore<CounterState>("counterStore", (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    useCounter.getState().increment();
    useCounter.getState().increment();

    expect(useCounter.getState().count).toBe(2);
  });

  it("keeps independent state across separate stores", () => {
    const storeA = createStore<CounterState>("storeA", (set) => ({
      count: 1,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const storeB = createStore<CounterState>("storeB", (set) => ({
      count: 100,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    storeA.getState().increment();

    expect(storeA.getState().count).toBe(2);
    expect(storeB.getState().count).toBe(100);
  });
});
