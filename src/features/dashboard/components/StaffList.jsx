import { useLayoutEffect, useRef, useState } from "react";

export default function StaffList({ children, count, label }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(undefined);
  useLayoutEffect(() => {
    const list = ref.current;
    if (count <= 2) { setHeight(undefined); return; }
    const rows = [...list.children].slice(0, 2);
    const measure = () => {
      const first = rows[0].getBoundingClientRect();
      const second = rows[1].getBoundingClientRect();
      setHeight(Math.ceil(second.bottom - first.top));
    };
    const observer = new ResizeObserver(measure);
    rows.forEach(row => observer.observe(row));
    measure();
    return () => observer.disconnect();
  }, [count]);
  return <div ref={ref} className="dashboard-workload-list dashboard-staff-list"
    role="region" aria-label={label} tabIndex={count > 2 ? 0 : undefined}
    style={{ maxHeight: count > 2 ? height : undefined, overflowY: count > 2 ? "auto" : undefined }}>
    {children}
  </div>;
}
