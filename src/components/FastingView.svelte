<script>
  import { onMount } from 'svelte';
  import Term from './Term.svelte';
  import ProgressRing from './ProgressRing.svelte';
  import Guidance from './Guidance.svelte';
  import HydrationTracker from './HydrationTracker.svelte';
  import PrayerSchedule from './PrayerSchedule.svelte';
  import Glossary from './Glossary.svelte';
  import LocationBar from './LocationBar.svelte';
  import { timeToMinutes, minutesToTime, formatCountdown, nowMinutes } from '../lib/timeUtils.js';
  import { getRamadanInfo, getFastPhase } from '../lib/ramadan.js';
  import { getGuidance } from '../lib/guidance.js';
  import { getLocation } from '../stores/location.js';
  import { getPrayerTimes } from '../stores/prayerTimes.js';

  import { getAuth } from '../stores/auth.js';

  let { onsettingsopen, onauthopen } = $props();

  const location = getLocation();
  const pt = getPrayerTimes();
  const auth = getAuth();

  let now = $state(nowMinutes());
  let interval;

  onMount(() => {
    interval = setInterval(() => { now = nowMinutes(); }, 30000);
    return () => clearInterval(interval);
  });

  const timings = $derived(pt.timings);
  const fajr = $derived(timings ? timeToMinutes(timings.Fajr) : 0);
  const maghrib = $derived(timings ? timeToMinutes(timings.Maghrib) : 0);
  const isha = $derived(timings ? timeToMinutes(timings.Isha) : 0);

  const phase = $derived(timings ? getFastPhase(now, fajr, maghrib) : 'eating');
  const ramInfo = $derived(getRamadanInfo());
  const guidance = $derived(timings ? getGuidance(now, fajr, maghrib, isha) : null);

  const progress = $derived.by(() => {
    if (!timings) return 0;
    if (phase === 'fasting') {
      const totalFast = maghrib - fajr;
      const elapsed = now - fajr;
      return Math.min(Math.max(elapsed / totalFast, 0), 1);
    } else {
      let nextFajr = fajr;
      if (now > fajr) nextFajr = fajr + 1440;
      const eatingTotal = now < fajr ? (fajr - maghrib + 1440) : (nextFajr - maghrib);
      const eatingElapsed = now >= maghrib ? (now - maghrib) : (now + 1440 - maghrib);
      return Math.min(Math.max(eatingElapsed / eatingTotal, 0), 1);
    }
  });

  const ringTime = $derived.by(() => {
    if (!timings) return '';
    if (phase === 'fasting') {
      return formatCountdown(maghrib - now);
    } else {
      let nextFajr = fajr;
      if (now > fajr) nextFajr = fajr + 1440;
      const untilFajr = now < fajr ? (fajr - now) : (nextFajr - now);
      return formatCountdown(untilFajr);
    }
  });

  const ringLabel = $derived(phase === 'fasting' ? 'remaining' : 'until fajr');
  const ringSub = $derived(phase === 'fasting' ? `${Math.round(progress * 100)}% complete` : 'eating window');

  const dayLabel = $derived.by(() => {
    if (ramInfo.isRamadan) return `ramadan day ${ramInfo.day} of 30`;
    if (ramInfo.upcoming) return `${ramInfo.daysUntil} days until ramadan`;
    return 'ramadan has ended';
  });

  const dateStr = $derived(new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

  const locationDisplay = $derived.by(() => {
    if (location.locationName) {
      const methodName = pt.meta?.method?.name || '';
      return methodName ? `${location.locationName} — ${methodName}` : location.locationName;
    }
    return '';
  });
</script>

<div class="header fade-in">
  <div class="header-top">
    <div class="logo">sawm <span>/ companion</span></div>
    <div class="header-right">
      <div class="header-meta">{dateStr}</div>
      <button class="profile-btn" onclick={onauthopen} aria-label={auth.isAuthenticated ? 'Profile' : 'Sign in'}>
        {#if auth.isAuthenticated}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="5" r="3"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="5" r="3"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
  <div class="ramadan-day">{dayLabel}</div>
</div>

<LocationBar locationName={locationDisplay} error={location.error} onclick={onsettingsopen} />

{#if timings}
  <div class="status-label {phase} fade-in">
    {#if phase === 'fasting'}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12 1C8.5 2 6 5 6 8.5c0 2.5 1 4.5 3 5.5-4-1-6-4.5-5-8.5C5 2 8 0 12 1z"/></svg>
      fasting in progress
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      eating window open
    {/if}
  </div>

  <ProgressRing {progress} time={ringTime} label={ringLabel} sub={ringSub} {phase} />

  <div class="time-markers fade-in">
    <div class="time-marker">
      <div class="time-marker-label"><Term word="Fajr" /></div>
      <div class="time-marker-value">{minutesToTime(fajr)}</div>
    </div>
    <div class="time-marker">
      <div class="time-marker-label"><Term word="Maghrib" /></div>
      <div class="time-marker-value">{minutesToTime(maghrib)}</div>
    </div>
    <div class="time-marker">
      <div class="time-marker-label"><Term word="Isha" /></div>
      <div class="time-marker-value">{minutesToTime(isha)}</div>
    </div>
  </div>

  {#if guidance}
    <Guidance {guidance} />
  {/if}

  <HydrationTracker enabled={phase === 'eating'} />

  <PrayerSchedule {timings} />

  <Glossary />

  <div class="footer fade-in">
    sawm — a fasting companion<br>
    built with care. no ads. no tracking. no corporate nonsense.<br>
    prayer times via <a href="https://aladhan.com" target="_blank" rel="noopener">aladhan.com</a>
  </div>
{:else}
  <div class="loading">
    <div class="loading-spinner"></div>
    <div>loading prayer times...</div>
  </div>
{/if}
