const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toMonthIndex(value) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}

function getMonthDetails(index) {
  const year = Math.floor(index / 12);
  const month = index % 12;

  return {
    year,
    month,
    key: `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`,
    fullLabel: `${monthNames[month]} ${year}`,
  };
}

export default function buildPaymentChart(
  points,
  startDate,
  endDate,
) {
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const currentYear = Number(
    todayParts.find((part) => part.type === "year").value,
  );

  const currentMonth = Number(
    todayParts.find((part) => part.type === "month").value,
  );

  const currentMonthIndex = currentYear * 12 + currentMonth - 1;

  const valuesByMonth = new Map();
  let earliestPayment = Infinity;
  let latestPayment = -Infinity;

  for (const point of points) {
    const index = toMonthIndex(point.month);

    if (!Number.isInteger(index) || !Number.isFinite(point.value)) {
      continue;
    }

    valuesByMonth.set(
      index,
      (valuesByMonth.get(index) ?? 0) + point.value,
    );

    earliestPayment = Math.min(earliestPayment, index);
    latestPayment = Math.max(latestPayment, index);
  }

  let firstMonth;
  let lastMonth;

  if (!startDate && !endDate) {
    firstMonth = currentYear * 12;
    lastMonth = firstMonth + 11;
  } else if (startDate && endDate) {
    firstMonth = toMonthIndex(startDate);
    lastMonth = toMonthIndex(endDate);
  } else if (startDate) {
    firstMonth = toMonthIndex(startDate);
    lastMonth = Math.max(
      firstMonth,
      currentMonthIndex,
      latestPayment,
    );
  } else {
    lastMonth = toMonthIndex(endDate);

    const januaryOfEndYear = Math.floor(lastMonth / 12) * 12;

    firstMonth = Math.min(
      januaryOfEndYear,
      earliestPayment,
      lastMonth,
    );
  }

  if (firstMonth > lastMonth) {
    return { data: [], periodLabel: "" };
  }

  const first = getMonthDetails(firstMonth);
  const last = getMonthDetails(lastMonth);
  const spansYears = first.year !== last.year;

  const data = [];

  for (let index = firstMonth; index <= lastMonth; index += 1) {
    const month = getMonthDetails(index);

    data.push({
      key: month.key,
      label: spansYears
        ? month.fullLabel
        : monthNames[month.month],
      value: valuesByMonth.get(index) ?? 0,
    });
  }

  const periodLabel =
    firstMonth === lastMonth
      ? first.fullLabel
      : `${first.fullLabel} – ${last.fullLabel}`;

  return { data, periodLabel };
}