export const problemCategoryOptions = [
  { value: "CHARGING", label: "Charging" },
  { value: "BATTERY", label: "Battery" },
  { value: "DISPLAY", label: "Display" },
  { value: "POWER", label: "Power" },
  { value: "AUDIO", label: "Audio" },
  { value: "CAMERA", label: "Camera" },
  { value: "CONNECTIVITY", label: "Connectivity" },
  { value: "SOFTWARE", label: "Software" },
  { value: "COOLING", label: "Cooling" },
  { value: "OTHER", label: "Other" },
];

export function getProblemCategoryLabel(category) {
  if (category == null || category === "") {
    return "Uncategorized";
  }

  return (
    problemCategoryOptions.find((option) => option.value === category)
      ?.label ?? "Unknown category"
  );
}

export function isValidProblemCategory(category) {
  return problemCategoryOptions.some(
    (option) => option.value === category,
  );
}

export function getRepeatedDeviceProblems(repairs = []) {
  const groups = new Map();

  for (const repair of repairs) {
    if (
      !repair?.id ||
      !repair.deviceId ||
      repair.status === "CANCELLED" ||
      !isValidProblemCategory(repair.problemCategory) ||
      repair.problemCategory === "OTHER"
    ) {
      continue;
    }

    const key = `${repair.deviceId}:${repair.problemCategory}`;

    if (!groups.has(key)) {
      groups.set(key, {
        deviceId: repair.deviceId,
        category: repair.problemCategory,
        repairsById: new Map(),
      });
    }

    // A repair counts once, even if it appears more than once in the input.
    groups.get(key).repairsById.set(repair.id, repair);
  }

  return [...groups.values()]
    .filter((group) => group.repairsById.size >= 2)
    .map((group) => ({
      deviceId: group.deviceId,
      category: group.category,
      count: group.repairsById.size,
      repairs: [...group.repairsById.values()],
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.category.localeCompare(b.category),
    );
}