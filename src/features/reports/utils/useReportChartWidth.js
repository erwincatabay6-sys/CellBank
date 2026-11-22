import { useEffect, useRef, useState } from "react";

export default function useReportChartWidth(minimum) {
  const ref = useRef(null);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      if (element.clientWidth) setAvailable(element.clientWidth);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width: Math.max(minimum, available) };
}
