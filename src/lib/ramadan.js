export function getRamadanInfo() {
  const now = new Date();

  // Known Ramadan 2026 dates (confirmed by Saudi moon sighting)
  const ramadanStart = new Date(2026, 1, 18); // Feb 18
  const ramadanEnd = new Date(2026, 2, 20);   // Mar 20 (Eid expected Mar 20)

  if (now >= ramadanStart && now < ramadanEnd) {
    const diffMs = now - ramadanStart;
    const day = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return { isRamadan: true, day: Math.min(day, 30), totalDays: 30 };
  }

  if (now < ramadanStart) {
    const daysUntil = Math.ceil((ramadanStart - now) / (1000 * 60 * 60 * 24));
    return { isRamadan: false, daysUntil, upcoming: true };
  }

  return { isRamadan: false, upcoming: false };
}

export function getFastPhase(nowMins, fajrMins, maghribMins) {
  if (nowMins >= fajrMins && nowMins < maghribMins) {
    return 'fasting';
  }
  return 'eating';
}
