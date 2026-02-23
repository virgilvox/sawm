<script>
  import Term from './Term.svelte';
  import { todayStr } from '../lib/timeUtils.js';

  let { enabled = false } = $props();

  let count = $state(parseInt(localStorage.getItem('sawm_hydration_count') || '0'));
  let goal = $state(parseInt(localStorage.getItem('sawm_hydration_goal') || '8'));
  let hydrationDate = $state(localStorage.getItem('sawm_hydration_date') || '');

  // Reset daily
  $effect(() => {
    const today = todayStr();
    if (hydrationDate !== today) {
      count = 0;
      hydrationDate = today;
      localStorage.setItem('sawm_hydration_date', today);
      localStorage.setItem('sawm_hydration_count', '0');
    }
  });

  function toggleCup(index) {
    if (index < count) {
      count = index;
    } else {
      count = index + 1;
    }
    localStorage.setItem('sawm_hydration_count', String(count));
  }

  function adjust(delta) {
    count = Math.max(0, Math.min(count + delta, goal + 4));
    localStorage.setItem('sawm_hydration_count', String(count));
  }

  const pct = $derived(Math.round(count / goal * 100));
  const barWidth = $derived(Math.min(count / goal * 100, 100));
</script>

<div class="section fade-in">
  <div class="section-header">hydration tracker {enabled ? '' : '(opens at iftar)'}</div>
  <div class="hydration">
    {#if enabled}
      <div class="hydration-header">
        <div class="hydration-count">{count} <span>/ {goal} cups</span></div>
        <div class="hydration-goal">{pct}%</div>
      </div>
      <div class="hydration-bar-track">
        <div class="hydration-bar-fill" style="width: {barWidth}%"></div>
      </div>
      <div class="hydration-cups">
        {#each Array(goal) as _, i}
          <button class="hydration-cup" class:filled={i < count} onclick={() => toggleCup(i)}>
            {#if i < count}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="5"/></svg>
            {:else}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/></svg>
            {/if}
          </button>
        {/each}
      </div>
      <div class="hydration-actions">
        <button class="hydration-btn" onclick={() => adjust(-1)}>- 1 cup</button>
        <button class="hydration-btn primary" onclick={() => adjust(1)}>+ 1 cup</button>
      </div>
    {:else}
      <div class="hydration-disabled">
        hydration tracking activates during the eating window.<br>
        focus on your fast — water comes at <Term word="Maghrib" />.
      </div>
    {/if}
  </div>
</div>
