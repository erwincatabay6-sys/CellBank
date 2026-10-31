import { useCallback, useState } from "react";

// Preserve the original value for business guards; identify every new result,
// including identical messages and updates batched in the same event.
export default function useFeedbackState(initialValue = "") {
  const [feedback, setFeedback] = useState({ value: initialValue, version: 0 });

  const setValue = useCallback((value) => {
    setFeedback((current) => ({
      value: typeof value === "function" ? value(current.value) : value,
      version: current.version + 1,
    }));
  }, []);

  return [feedback.value, setValue, feedback.version];
}
