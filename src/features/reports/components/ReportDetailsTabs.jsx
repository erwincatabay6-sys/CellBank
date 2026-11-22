const tabs = [
  { id: "repairs", label: "Repair records" },
  { id: "financial", label: "Financial records" },
  { id: "technicians", label: "Technician activity" },
];

export default function ReportDetailsTabs({ selected, onSelect, panels }) {
  function handleKeyDown(event, index) {
    let next;
    switch (event.key) {
      case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
      case "ArrowRight": next = (index + 1) % tabs.length; break;
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      default: return;
    }

    event.preventDefault();
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
    onSelect(tabs[next].id);
  }

  return (
    <section className="report-details">
      <div className="report-tab-list" role="tablist" aria-label="Report details">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`report-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === tab.id}
            aria-controls={`report-panel-${tab.id}`}
            tabIndex={selected === tab.id ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="report-tab-panel"
          id={`report-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`report-tab-${tab.id}`}
          hidden={selected !== tab.id}
          tabIndex={0}
        >
          {panels[tab.id]}
        </div>
      ))}
    </section>
  );
}
