// Isolated browser fixture; never imported by the production entry point.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import FeedbackProvider, {
  useFeedback,
} from "../../src/features/feedback/FeedbackProvider.jsx";
import useFeedbackState from "../../src/hooks/useFeedbackState.js";
import FeedbackNotice from "../../src/components/FeedbackNotice.jsx";
import "../../src/styles/global.css";

function Form({ onNavigate }) {
  const [, setMessage] = useFeedbackState("", {
    toast: { variant: "success", title: "Saved" },
  });
  return (
    <button
      type="button"
      onClick={() => {
        setMessage("Same saved result");
        onNavigate();
      }}
    >
      Save and navigate
    </button>
  );
}
function Fixture() {
  const { publish } = useFeedback();
  const [page, setPage] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [, success] = useFeedbackState("", {
    toast: { variant: "success", title: "Saved" },
  });
  const [, error] = useFeedbackState("", {
    toast: { variant: "error", title: "Unable to save" },
  });
  return (
    <main style={{ padding: 24 }}>
      <button type="button" onClick={() => success("Same saved result")}>
        Success
      </button>
      <button type="button" onClick={() => error("Same error result")}>
        Error
      </button>
      <button
        type="button"
        onClick={() => {
          for (let i = 1; i <= 5; i++) error(`Queued error ${i}`);
        }}
      >
        Five errors
      </button>
      <button type="button" onClick={() => setRenderCount((n) => n + 1)}>
        Rerender {renderCount}
      </button>
      <button
        type="button"
        onClick={() => {
          for (const variant of ["success", "error", "warning", "info"])
            publish({
              variant,
              title: variant,
              message: "Long message ".repeat(45),
            });
        }}
      >
        Long variants
      </button>
      <button
        type="button"
        onClick={() => {
          document.documentElement.dataset.theme =
            document.documentElement.dataset.theme === "dark"
              ? "light"
              : "dark";
        }}
      >
        Theme
      </button>
      <button type="button" onClick={() => setPage(0)}>
        Return to form
      </button>
      {page === 0 ? <Form onNavigate={() => setPage(1)} /> : <h1>Next page</h1>}
      <FeedbackNotice
        title="Unable to load records"
        actions={<button type="button">Retry records</button>}
      >
        A persistent explanation next to the affected content.
      </FeedbackNotice>
      <p>
        Clicks outside the toast region must still reach the controls above.
      </p>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FeedbackProvider>
      <Fixture />
    </FeedbackProvider>
  </StrictMode>,
);
