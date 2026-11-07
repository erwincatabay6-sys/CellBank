import { useCallback, useRef, useState } from "react";
import { useFeedback } from "../features/feedback/FeedbackProvider.jsx";

// State still owns all business guards. Presentation never clears that state.
// An optional toast is published at the action boundary, including before navigation.
export default function useFeedbackState(initialValue = "", options = {}) {
  const store = useFeedback();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const valueRef = useRef(initialValue);
  const [feedback, setFeedback] = useState({
    value: initialValue,
    version: 0,
    inline: true,
  });

  const setValue = useCallback(
    (value, presentation = {}) => {
      const nextValue =
        typeof value === "function" ? value(valueRef.current) : value;
      valueRef.current = nextValue;
      const toast = Object.hasOwn(presentation, "toast")
        ? presentation.toast
        : optionsRef.current.toast;
      const notification =
        nextValue &&
        !presentation.field &&
        (typeof toast === "function"
          ? toast(nextValue)
          : toast && { ...toast, message: nextValue });
      if (notification) store.publish(notification);
      setFeedback((current) => ({
        value: nextValue,
        version: current.version + 1,
        inline: !notification,
        field: presentation.field || null,
      }));
    },
    [store],
  );

  return [
    feedback.value,
    setValue,
    feedback.version,
    feedback.inline,
    feedback.field,
  ];
}
