function formatChartValue(
    value,
    valueType
) {

    if (valueType === "currency") {
        return `₱${value.toLocaleString()}`;
    }

    return value.toLocaleString();
}


function ReportLineChart({
    data,
    ariaLabel,
    valueType = "count"
}) {

    if (data.length === 0) {
        return (
            <div className="report-chart-empty">
                No data is available for the selected period.
            </div>
        );
    }


    const width = 640;
    const height = 270;

    const padding = {
        top: 24,
        right: 24,
        bottom: 52,
        left: 64
    };


    const plotWidth =
        width - padding.left - padding.right;

    const plotHeight =
        height - padding.top - padding.bottom;


    const maxValue =
        Math.max(
            ...data.map(
                (item) => item.value
            ),
            1
        );


    let yMax;


    if (valueType === "currency") {

        const step =
            Math.max(
                Math.ceil(
                    maxValue / 4 / 500
                ) * 500,
                500
            );

        yMax =
            step * 4;
    }
    else {

        yMax =
            Math.max(
                Math.ceil(
                    maxValue / 4
                ) * 4,
                4
            );
    }


    const points =
        data.map((item, index) => {

            const x =
                data.length === 1
                    ? padding.left + plotWidth / 2
                    : padding.left +
                        (index / (data.length - 1)) *
                            plotWidth;

            const y =
                padding.top +
                plotHeight -
                (item.value / yMax) *
                    plotHeight;


            return {
                ...item,
                x,
                y
            };
        });


    const pathData =
        points
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


    const yTicks =
        [0, 0.25, 0.5, 0.75, 1]
            .map((ratio) => ({
                ratio,
                value:
                    Math.round(
                        yMax * ratio
                    )
            }));


    return (
        <div
            className="report-line-chart-wrapper"
            role="img"
            aria-label={ariaLabel}
        >

            <svg
                className="report-line-chart"
                viewBox={`0 0 ${width} ${height}`}
                aria-hidden="true"
            >

                {yTicks.map((tick) => {

                    const y =
                        padding.top +
                        plotHeight -
                        tick.ratio *
                            plotHeight;


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
                                {formatChartValue(
                                    tick.value,
                                    valueType
                                )}
                            </text>

                        </g>
                    );
                })}


                <line
                    className="report-chart-axis-line"
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + plotHeight}
                    y2={padding.top + plotHeight}
                />


                {points.length > 1 && (
                    <path
                        className="report-chart-line"
                        d={pathData}
                        fill="none"
                    />
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
                            {formatChartValue(
                                point.value,
                                valueType
                            )}
                        </text>

                        <text
                            className="report-chart-x-label"
                            x={point.x}
                            y={height - 18}
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
