<script>
  import PrayerTracker from './PrayerTracker.svelte';
  import FastingLog from './FastingLog.svelte';
  import { getAuth, getConvexClient } from '../stores/auth.svelte.js';
  import { todayStr } from '../lib/timeUtils.js';
  import { api } from '../../convex/_generated/api.js';

  let { onauthopen } = $props();

  const auth = getAuth();

  let prayerData = $state(null);
  let fastingData = $state(null);

  // Summary metrics
  let summaryPrayerLogs = $state([]);
  let summaryFastingLogs = $state([]);
  let summaryLoaded = $state(false);

  const RAMADAN_START = '2026-02-18';

  const daysElapsed = $derived(Math.max(1, Math.floor((new Date() - new Date(2026, 1, 18)) / 86400000) + 1));

  const daysFasted = $derived(summaryFastingLogs.filter(l => l.completed).length);

  const prayerScore = $derived.by(() => {
    if (summaryPrayerLogs.length === 0) return 0;
    const total = summaryPrayerLogs.reduce((sum, l) => {
      const done = [l.fajr, l.dhuhr, l.asr, l.maghrib, l.isha].filter(Boolean).length;
      return sum + done;
    }, 0);
    return Math.round((total / (summaryPrayerLogs.length * 5)) * 100);
  });

  const currentStreak = $derived.by(() => {
    const sorted = [...summaryFastingLogs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = todayStr();
    for (const log of sorted) {
      if (!log.completed) break;
      streak++;
    }
    return streak;
  });

  // Load from localStorage as instant cache, then fetch from Convex
  $effect(() => {
    if (auth.isAuthenticated) {
      const cachedPrayer = localStorage.getItem(`sawm_prayer_${todayStr()}`);
      const cachedFasting = localStorage.getItem(`sawm_fasting_${todayStr()}`);
      if (cachedPrayer) prayerData = JSON.parse(cachedPrayer);
      if (cachedFasting) fastingData = JSON.parse(cachedFasting);
      loadFromConvex();
    }
  });

  function dateRange(startStr, endStr) {
    // Generate YYYY-MM-DD strings matching todayStr() format (UTC)
    const dates = [];
    let d = new Date(startStr + 'T00:00:00Z');
    const end = new Date(endStr + 'T00:00:00Z');
    while (d <= end) {
      dates.push(d.toISOString().slice(0, 10));
      d = new Date(d.getTime() + 86400000);
    }
    return dates;
  }

  function loadLocalSummary() {
    const pLogs = [];
    const fLogs = [];
    for (const ds of dateRange(RAMADAN_START, todayStr())) {
      const p = localStorage.getItem(`sawm_prayer_${ds}`);
      const f = localStorage.getItem(`sawm_fasting_${ds}`);
      if (p) pLogs.push(JSON.parse(p));
      if (f) fLogs.push(JSON.parse(f));
    }
    summaryPrayerLogs = pLogs;
    summaryFastingLogs = fLogs;
    summaryLoaded = true;
  }

  async function loadFromConvex() {
    const client = getConvexClient();
    if (!client) { loadLocalSummary(); return; }
    try {
      const [prayer, fasting, prayerRange, fastingRange] = await Promise.all([
        client.query(api.prayerLogs.getForDate, { date: todayStr() }),
        client.query(api.fastingLogs.getForDate, { date: todayStr() }),
        client.query(api.prayerLogs.getRange, { startDate: RAMADAN_START, endDate: todayStr() }),
        client.query(api.fastingLogs.getRange, { startDate: RAMADAN_START, endDate: todayStr() }),
      ]);
      if (prayer) {
        prayerData = prayer;
        localStorage.setItem(`sawm_prayer_${todayStr()}`, JSON.stringify(prayer));
      }
      if (fasting) {
        fastingData = fasting;
        localStorage.setItem(`sawm_fasting_${todayStr()}`, JSON.stringify(fasting));
      }
      summaryPrayerLogs = prayerRange || [];
      summaryFastingLogs = fastingRange || [];
      summaryLoaded = true;
    } catch (e) {
      console.warn('convex load failed, falling back to localStorage', e);
      loadLocalSummary();
    }
  }

  async function savePrayer(data) {
    prayerData = data;
    localStorage.setItem(`sawm_prayer_${todayStr()}`, JSON.stringify(data));
    loadLocalSummary();
    const client = getConvexClient();
    if (client) {
      try {
        await client.mutation(api.prayerLogs.upsert, {
          date: data.date,
          fajr: data.fajr,
          dhuhr: data.dhuhr,
          asr: data.asr,
          maghrib: data.maghrib,
          isha: data.isha,
          taraweeh: data.taraweeh || false,
        });
      } catch (e) {
        console.warn('convex prayer save failed', e);
      }
    }
  }

  async function saveFasting(data) {
    fastingData = data;
    localStorage.setItem(`sawm_fasting_${todayStr()}`, JSON.stringify(data));
    loadLocalSummary();
    const client = getConvexClient();
    if (client) {
      try {
        await client.mutation(api.fastingLogs.upsert, {
          date: data.date,
          completed: data.completed,
          suhoorTime: data.suhoorTime || undefined,
          iftarTime: data.iftarTime || undefined,
          notes: data.notes || undefined,
        });
      } catch (e) {
        console.warn('convex fasting save failed', e);
      }
    }
  }
</script>

{#if auth.isAuthenticated}
  <div class="header fade-in">
    <div class="header-top">
      <div class="logo"><svg class="logo-icon" width="22" height="22" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="16" fill="#0a0a0a"/><g transform="translate(60,58)"><circle cx="0" cy="0" r="42" fill="none" stroke="#4a4a4a" stroke-width="5"/><path d="M0-42A42 42 0 1 1-31 28.5" fill="none" stroke="#d4a043" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="0" r="19" fill="#d4a043"/><circle cx="7" cy="-5" r="16" fill="#0a0a0a"/></g></svg> sawm <span>/ track</span></div>
      <div class="header-meta">{todayStr()}</div>
    </div>
  </div>

  {#if summaryLoaded}
    <div class="section fade-in">
      <div class="section-header">ramadan summary</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">{daysFasted}<span>/{daysElapsed}</span></div>
          <div class="summary-label">days fasted</div>
          <div class="summary-bar-track"><div class="summary-bar-fill" style="width: {Math.round((daysFasted / daysElapsed) * 100)}%"></div></div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{prayerScore}<span>%</span></div>
          <div class="summary-label">prayer score</div>
          <div class="summary-bar-track"><div class="summary-bar-fill prayer" style="width: {prayerScore}%"></div></div>
        </div>
        <div class="summary-card streak">
          <div class="summary-value">{currentStreak}</div>
          <div class="summary-label">day streak</div>
        </div>
      </div>
    </div>
  {/if}

  <PrayerTracker data={prayerData} onsave={savePrayer} />
  <FastingLog data={fastingData} onsave={saveFasting} />
{:else}
  <div class="header fade-in">
    <div class="header-top">
      <div class="logo"><svg class="logo-icon" width="22" height="22" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="16" fill="#0a0a0a"/><g transform="translate(60,58)"><circle cx="0" cy="0" r="42" fill="none" stroke="#4a4a4a" stroke-width="5"/><path d="M0-42A42 42 0 1 1-31 28.5" fill="none" stroke="#d4a043" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="0" r="19" fill="#d4a043"/><circle cx="7" cy="-5" r="16" fill="#0a0a0a"/></g></svg> sawm <span>/ track</span></div>
    </div>
  </div>

  <div class="auth-gate fade-in">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--text-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
      <rect x="12" y="22" width="24" height="20" rx="3"/>
      <path d="M17 22V16a7 7 0 0114 0v6"/>
    </svg>
    <p>sign in to track your ramadan journey.<br>log prayers, fasting days, and meal notes. all synced to the cloud.</p>
    <button class="auth-gate-btn" onclick={onauthopen}>sign in to start tracking</button>
  </div>
{/if}
