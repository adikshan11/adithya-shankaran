// Shared open state, so the "piano" word in the intro and the piano section open the same instrument.
let open = false;
const listeners = new Set<() => void>();

export const pianoStore = {
  get: () => open,
  set(value: boolean) {
    if (open === value) return;
    open = value;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
