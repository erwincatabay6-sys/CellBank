import { useEffect, useState } from "react";

export default function useCountdown(deadline) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    if (!deadline || deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      update();
      if (Date.now() >= deadline) window.clearInterval(timer);
    }, 250);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
