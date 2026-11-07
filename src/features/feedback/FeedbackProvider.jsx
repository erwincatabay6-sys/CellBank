import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { FeedbackCard } from "../../components/FeedbackNotice.jsx";
import {
  createToastStore,
  MAX_VISIBLE_TOASTS,
  SUCCESS_DURATION_MS,
} from "./toastStore.js";

const FeedbackContext = createContext(null);

export function useFeedback() {
  const store = useContext(FeedbackContext);
  if (!store)
    throw new Error("useFeedback must be used inside FeedbackProvider.");
  return store;
}

function Toast({ notification, dismiss }) {
  const remaining = useRef(SUCCESS_DURATION_MS);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (notification.variant !== "success" || hovered || focused || hidden)
      return;

    const started = performance.now();
    const timer = window.setTimeout(
      () => dismiss(notification.id),
      remaining.current,
    );
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - started),
      );
    };
  }, [
    notification.id,
    notification.variant,
    dismiss,
    hovered,
    focused,
    hidden,
  ]);

  return (
    <FeedbackCard
      variant={notification.variant}
      title={notification.title}
      className="feedback-toast"
      onDismiss={() => dismiss(notification.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      {notification.message}
    </FeedbackCard>
  );
}

function ToastContainer({ store }) {
  const notifications = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  return createPortal(
    <section className="feedback-toasts" aria-label="Action notifications">
      {notifications.slice(0, MAX_VISIBLE_TOASTS).map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          dismiss={store.dismiss}
        />
      ))}
    </section>,
    document.body,
  );
}

export default function FeedbackProvider({ children }) {
  const [store] = useState(createToastStore);
  return (
    <FeedbackContext.Provider value={store}>
      {children}
      <ToastContainer store={store} />
    </FeedbackContext.Provider>
  );
}
