export default function ReportChartData({ data, label, valueLabel, formatValue }) {
  return (
    <details className="report-chart-data">
      <summary>View chart data<span className="report-visually-hidden">: {label}</span></summary>
      <table aria-label={label}>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">{item.label}</th>
              <td>{formatValue(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
