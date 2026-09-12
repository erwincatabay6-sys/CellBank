function ReportBarChart({
    data,
    ariaLabel
}) {

    if (data.length === 0) {
        return (
            <div className="report-chart-empty">
                No data is available for the selected period.
            </div>
        );
    }


    const maxValue =
        Math.max(
            ...data.map(
                (item) => item.value
            ),
            1
        );


    return (
        <div
            className="report-bar-chart"
            role="img"
            aria-label={ariaLabel}
        >

            {data.map((item) => {

                const width =
                    item.value === 0
                        ? 0
                        : Math.max(
                            (item.value / maxValue) * 100,
                            5
                        );


                return (
                    <div
                        className="report-bar-row"
                        key={item.key ?? item.label}
                    >

                        <span className="report-bar-label">
                            {item.label}
                        </span>

                        <div className="report-bar-track">

                            <div
                                className="report-bar-fill"
                                style={{
                                    width: `${width}%`
                                }}
                            />

                        </div>

                        <strong className="report-bar-value">
                            {item.value}
                        </strong>

                    </div>
                );
            })}

        </div>
    );
}


export default ReportBarChart;
