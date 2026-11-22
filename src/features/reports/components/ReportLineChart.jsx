import { useId } from "react";
import useReportChartWidth from "../utils/useReportChartWidth.js";

function formatCount(value) {
  return value.toLocaleString();
}

function ReportLineChart({ data, ariaLabel }) {
  if (data.length === 0) {
    return (
      <div className="report-chart-empty">
        No data is available for the selected period.
      </div>
    );
  }

  return <LinePlot data={data} ariaLabel={ariaLabel} />;
}

function LinePlot({ data, ariaLabel }) {
  const { ref, width } = useReportChartWidth(Math.max(270, 90 + (data.length - 1) * 72));
  const descriptionId = useId();
  const height = 214;
  const padding = { top: 25, right: 35, bottom: 40, left: 43 };

  const plotWidth = width - padding.left - padding.right;

  const plotHeight = height - padding.top - padding.bottom;
  const baseline = padding.top + plotHeight;

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  const yMax = Math.max(Math.ceil(maxValue / 4) * 4, 4);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (data.length - 1)) * plotWidth;

    const y = baseline - (item.value / yMax) * plotHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: Math.round(yMax * ratio),
  }));

  return (
    <div
      ref={ref}
      className="report-line-chart-wrapper"
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <svg
        className="report-line-chart"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width }}
        role="img"
        aria-label="Monthly repair volume"
        aria-describedby={descriptionId}
      >
        <desc id={descriptionId}>
          {data.map(({ label, value }) => `${label}: ${formatCount(value)}`).join("; ")}
        </desc>
        {yTicks.map((tick) => {
          const y = baseline - tick.ratio * plotHeight;

          return (
            <g key={tick.ratio}>
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
                {formatCount(tick.value)}
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

        {points.length > 1 && (
          <path className="report-chart-line" d={pathData} fill="none" />
        )}

        {points.map((point) => (
          <g key={point.key ?? point.label}>
            <circle
              className="report-chart-point"
              cx={point.x}
              cy={point.y}
              r="5"
            />

            <text
              className="report-chart-point-value"
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
            >
              {formatCount(point.value)}
            </text>

            <text
              className="report-chart-x-label"
              x={point.x}
              y={baseline + 22}
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default ReportLineChart;
