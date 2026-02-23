<script>
  import { todayStr } from '../lib/timeUtils.js';

  let { data = null, onsave } = $props();

  let showSaved = $state(false);
  let saveTimer;

  function flashSaved() {
    showSaved = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { showSaved = false; }, 1500);
  }

  const prayers = [
    { key: 'fajr', name: 'Fajr', required: true },
    { key: 'dhuhr', name: 'Dhuhr', required: true },
    { key: 'asr', name: 'Asr', required: true },
    { key: 'maghrib', name: 'Maghrib', required: true },
    { key: 'isha', name: 'Isha', required: true },
    { key: 'taraweeh', name: 'Taraweeh', required: false },
  ];

  let checked = $state({
    fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false, taraweeh: false,
  });

  $effect(() => {
    if (data) {
      checked = {
        fajr: data.fajr || false,
        dhuhr: data.dhuhr || false,
        asr: data.asr || false,
        maghrib: data.maghrib || false,
        isha: data.isha || false,
        taraweeh: data.taraweeh || false,
      };
    }
  });

  function toggle(key) {
    checked[key] = !checked[key];
    onsave({ ...checked, date: todayStr() });
    flashSaved();
  }

  const completedCount = $derived(
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(k => checked[k]).length
  );
</script>

<div class="section">
  <div class="section-header">prayers today / {completedCount}/5 {#if showSaved}<span class="save-indicator">saved</span>{/if}</div>
  <div class="prayer-tracker">
    {#each prayers as prayer}
      <button
        class="prayer-check"
        class:checked={checked[prayer.key]}
        class:optional={!prayer.required}
        onclick={() => toggle(prayer.key)}
      >
        <div class="prayer-check-box">
          {#if checked[prayer.key]}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 6l3 3 5-5"/>
            </svg>
          {/if}
        </div>
        <span class="prayer-check-name">{prayer.name}</span>
        {#if !prayer.required}
          <span class="prayer-check-label">optional</span>
        {/if}
      </button>
    {/each}
  </div>
</div>
