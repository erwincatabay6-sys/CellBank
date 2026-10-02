import { RadioTower } from "lucide-react";

function Brand() {
  return (
    <div className="header-brand">
      <RadioTower
        className="header-brand-icon"
        size={30}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      <div className="header-brand-text">
        <h1>Cellbank</h1>
        <span className="header-brand-subtitle">
          Repair Management System
        </span>
      </div>
    </div>
  );
}

export default Brand;