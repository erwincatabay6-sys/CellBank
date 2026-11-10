import { Wrench } from "lucide-react";

function RepairDevicesIllustration() {
  return (
    <svg className="landing-illustration" viewBox="0 0 560 380" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="292" cy="340" rx="235" ry="14" fill="var(--border)" opacity="0.5" />
      <g stroke="var(--text-secondary)" strokeWidth="3" strokeLinejoin="round">
        <rect x="82" y="62" width="346" height="233" rx="15" fill="var(--surface)" />
        <rect x="95" y="77" width="320" height="203" rx="5" fill="var(--surface-muted)" />
        <path d="M82 295h346l41 32v7H40v-7z" fill="var(--surface)" />
        <path d="M40 327h429M215 295l-9 14h97l-9-14" />
        <rect x="375" y="143" width="116" height="199" rx="19" fill="var(--surface)" />
        <rect x="385" y="154" width="96" height="176" rx="11" fill="var(--surface-muted)" />
        <path d="M418 155h30M423 320h20" strokeLinecap="round" />
      </g>
      <circle cx="254" cy="178" r="51" fill="var(--primary-soft)" />
      <Wrench x="224" y="148" width="60" height="60" stroke="var(--primary-dark)" strokeWidth="1.5" />
      <circle cx="433" cy="240" r="29" fill="var(--primary-soft)" />
      <Wrench x="415" y="222" width="36" height="36" stroke="var(--primary-dark)" strokeWidth="1.5" />
      <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round">
        <path d="M460 70v16m-8-8h16M50 167v12m-6-6h12M344 31v10m-5-5h10" />
        <circle cx="499" cy="116" r="5" />
        <circle cx="63" cy="106" r="4" />
      </g>
    </svg>
  );
}

export default RepairDevicesIllustration;
