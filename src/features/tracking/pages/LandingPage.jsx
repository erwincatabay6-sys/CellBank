import { Link } from "react-router-dom";
import { ArrowRight, Ticket, Laptop, CircleCheck } from "lucide-react";
import RepairDevicesIllustration from "../components/RepairDevicesIllustration.jsx";
import "../landing.css";

const steps = [
  {
    icon: Ticket,
    title: "Have your tracking code ready",
    description: "Use the code provided for your repair.",
  },
  {
    icon: Laptop,
    title: "Enter your tracking code",
    description: "Type your code on the tracking page.",
  },
  {
    icon: CircleCheck,
    title: "View your repair status",
    description: "See the current status of your repair.",
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero landing-container" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <h1 id="landing-title">
            Your repair updates, <span>all in one place.</span>
          </h1>
          <p>Check your device’s repair status using the tracking code provided to you.</p>
          <Link className="primary-action landing-track-link" to="/track">
            Track Your Repair <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <RepairDevicesIllustration />
      </section>

      <section className="landing-steps" aria-labelledby="landing-steps-title">
        <div className="landing-container">
          <h2 id="landing-steps-title">How repair tracking works</h2>
          <ol role="list">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <li key={title}>
                <div className="landing-step-icon">
                  <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div>
                  <h3>
                    <span className="landing-step-number" aria-hidden="true">{index + 1}.</span> {title}
                  </h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
