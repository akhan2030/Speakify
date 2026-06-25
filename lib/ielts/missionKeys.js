export function missionTaskKey(dateKey, taskId) {
  return `${dateKey}::${taskId}`;
}

export function parseMissionTaskKey(key) {
  const idx = String(key).indexOf("::");
  if (idx === -1) return { dateKey: null, taskId: key };
  return {
    dateKey: key.slice(0, idx),
    taskId: key.slice(idx + 2),
  };
}

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToDateKey(dateKey, delta) {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function yesterdayDateKey() {
  return addDaysToDateKey(todayDateKey(), -1);
}
