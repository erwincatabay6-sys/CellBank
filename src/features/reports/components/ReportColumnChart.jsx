import "./ReportColumnChart.css";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const axisFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function ReportColumnChart({ data, ariaLabel }) {
  if (data.length === 0) {
    return (
      <div className="report-chart-empty">
        No months are available for the selected period.
      </div>
    );
  }

  const width = Math.max(1200, data.length * 85 + 110);
  const height = 340;

  const padding = {
    top: 35,
    right: 20,
    bottom: 55,
    left: 90,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = data.reduce(
    (maximum, item) => Math.max(maximum, item.value),
    0,
  );

  const paddedMax = Math.max(maxValue * 1.2, 100);
  const magnitude = 10 ** Math.floor(Math.log10(paddedMax / 4));
  const tickStep = Math.ceil(paddedMax / 4 / magnitude) * magnitude;
  const yMax = tickStep * 4;

  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(slotWidth * 0.6, 65);
  const baseline = padding.top + plotHeight;

  return (
    <div
      className="report-column-chart-wrapper"
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <svg
        className="report-column-chart"
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: Math.max(720, data.length * 75) }}
        role="img"
        aria-label={ariaLabel}
      >
        <desc>
          {data
            .map(
              (item) =>
                `${item.label}: ${currencyFormatter.format(item.value)}`,
            )
            .join("; ")}
        </desc>

        {[0, 1, 2, 3, 4].map((index) => {
          const value = tickStep * index;
          const y = baseline - (value / yMax) * plotHeight;

          return (
            <g key={index}>
              <line
                className="report-chart-grid-line"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />

              <text
                className="report-chart-axis-label"
                x={padding.left - 12}
                y={y + 4}
                textAnchor="end"
              >
                {axisFormatter.format(value)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const centerX =
            padding.left + slotWidth * index + slotWidth / 2;

          const barHeight = (item.value / yMax) * plotHeight;
          const y = baseline - barHeight;

          return (
            <g key={item.key}>
              <title>
                {item.label}: {currencyFormatter.format(item.value)}
              </title>

              <rect
                className="report-column-bar"
                x={centerX - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
              />

              {item.value > 0 && (
                <text
                  className="report-column-value"
                  x={centerX}
                  y={y - 10}
                  textAnchor="middle"
                >
                  {axisFormatter.format(item.value)}
                </text>
              )}

              <text
                className="report-chart-x-label"
                x={centerX}
                y={baseline + 28}
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        <line
          className="report-chart-axis-line"
          x1={padding.left}
          x2={width - padding.right}
          y1={baseline}
          y2={baseline}
        />
      </svg>
    </div>
  );
}