<script>
  import PrayerTracker from './PrayerTracker.svelte';
  import FastingLog from './FastingLog.svelte';
  import { getAuth } from '../stores/auth.js';
  import { todayStr } from '../lib/timeUtils.js';

  let { onauthopen } = $props();

  const auth = getAuth();

  // Local state for tracking data (synced with Convex when authenticated)
  let prayerData = $state(null);
  let fastingData = $state(null);
  let convexClient = $state(null);

  // Load from localStorage as fallback / cache
  $effect(() => {
    if (auth.isAuthenticated) {
      const cachedPrayer = localStorage.getItem(`sawm_prayer_${todayStr()}`);
      const cachedFasting = localStorage.getItem(`sawm_fasting_${todayStr()}`);
      if (cachedPrayer) prayerData = JSON.parse(cachedPrayer);
      if (cachedFasting) fastingData = JSON.parse(cachedFasting);
    }
  });

  function savePrayer(data) {
    prayerData = data;
    localStorage.setItem(`sawm_prayer_${todayStr()}`, JSON.stringify(data));
    // TODO: sync to convex when client is wired
  }

  function saveFasting(data) {
    fastingData = data;
    localStorage.setItem(`sawm_fasting_${todayStr()}`, JSON.stringify(data));
    // TODO: sync to convex when client is wired
  }
</script>

{#if auth.isAuthenticated}
  <div class="header fade-in">
    <div class="header-top">
      <div class="logo">sawm <span>/ track</span></div>
      <div class="header-meta">{todayStr()}</div>
    </div>
  </div>

  <PrayerTracker data={prayerData} onsave={savePrayer} />
  <FastingLog data={fastingData} onsave={saveFasting} />
{:else}
  <div class="header fade-in">
    <div class="header-top">
      <div class="logo">sawm <span>/ track</span></div>
    </div>
  </div>

  <div class="auth-gate fade-in">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--text-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
      <rect x="12" y="22" width="24" height="20" rx="3"/>
      <path d="M17 22V16a7 7 0 0114 0v6"/>
    </svg>
    <p>sign in to track your ramadan journey.<br>log prayers, fasting days, and meal notes — all synced to the cloud.</p>
    <button class="auth-gate-btn" onclick={onauthopen}>sign in to start tracking</button>
  </div>
{/if}
