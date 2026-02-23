<script>
  import Term from './Term.svelte';
  import { timeToMinutes, minutesToTime, nowMinutes } from '../lib/timeUtils.js';

  let { timings } = $props();

  const prayers = $derived(timings ? [
    { name: 'Fajr', time: timeToMinutes(timings.Fajr) },
    { name: 'Sunrise', time: timeToMinutes(timings.Sunrise) },
    { name: 'Dhuhr', time: timeToMinutes(timings.Dhuhr) },
    { name: 'Asr', time: timeToMinutes(timings.Asr) },
    { name: 'Maghrib', time: timeToMinutes(timings.Maghrib) },
    { name: 'Isha', time: timeToMinutes(timings.Isha) },
  ] : []);

  const currentPrayer = $derived(() => {
    if (!prayers.length) return '';
    const now = nowMinutes();
    for (const p of prayers) {
      if (now < p.time) return p.name;
    }
    return prayers[prayers.length - 1].name;
  });
</script>

<div class="section fade-in">
  <div class="section-header">today's schedule</div>
  <div class="schedule">
    {#each prayers as p}
      <div class="schedule-item" class:active={p.name === currentPrayer()}>
        <div class="schedule-name"><Term word={p.name} /></div>
        <div class="schedule-time">{minutesToTime(p.time)}</div>
      </div>
    {/each}
  </div>
</div>
