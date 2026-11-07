// A provider owns one store. Publishing is an action, never a render effect.
export function createToastStore() {
  let nextId = 0;
  let notifications = [];
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => notifications,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(notification) {
      const id = ++nextId;
      notifications = [...notifications, { ...notification, id }];
      emit();
      return id;
    },
    dismiss(id) {
      notifications = notifications.filter((item) => item.id !== id);
      emit();
    },
  };
}

export const MAX_VISIBLE_TOASTS = 3;
export const SUCCESS_DURATION_MS = 5000;
