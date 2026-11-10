import { RadioTower } from "lucide-react";

function Brand({ nameAs: Name = "h1" }) {
  return (
    <div className="header-brand">
      <RadioTower
        className="header-brand-icon"
        size={30}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      <div className="header-brand-text">
        <Name className="header-brand-name"><span className="brand-name">Cell</span>bank</Name>
        <span className="header-brand-subtitle">
          Repair Management System
        </span>
      </div>
    </div>
  );
}

export default Brand;
