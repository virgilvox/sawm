<script>
  import { onMount } from 'svelte';
  import { getLocation } from '../stores/location.svelte.js';
  import { fetchNearbyMosques, formatDistance, openInMaps } from '../lib/mosqueApi.js';

  const location = getLocation();

  let mosques = $state([]);
  let loading = $state(false);
  let error = $state('');
  let radius = $state(5);
  let unit = $state(localStorage.getItem('sawm_distance_unit') || 'km');
  let searchTimer;

  const displayRadius = $derived(unit === 'mi' ? (radius * 0.621371).toFixed(1) : radius);
  const sliderMax = $derived(unit === 'mi' ? 16 : 25);

  function toggleUnit() {
    unit = unit === 'km' ? 'mi' : 'km';
    localStorage.setItem('sawm_distance_unit', unit);
  }

  async function search(r) {
    radius = r;
    if (!location.lat || !location.lng) {
      error = 'location not available';
      return;
    }
    loading = true;
    error = '';
    try {
      mosques = await fetchNearbyMosques(location.lat, location.lng, r);
      if (!mosques.length) error = 'no mosques found nearby. try a larger radius.';
    } catch (e) {
      error = 'failed to search. check your connection.';
    }
    loading = false;
  }

  function handleSlider(e) {
    const val = parseInt(e.target.value);
    radius = val;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => search(val), 400);
  }

  onMount(() => {
    if (location.lat && location.lng) search(radius);
  });

  $effect(() => {
    if (location.lat && location.lng && !mosques.length && !loading) {
      search(radius);
    }
  });
</script>

<div class="header fade-in">
  <div class="header-top">
    <div class="logo"><svg class="logo-icon" width="22" height="22" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="16" fill="#0a0a0a"/><g transform="translate(60,58)"><circle cx="0" cy="0" r="42" fill="none" stroke="#4a4a4a" stroke-width="5"/><path d="M0-42A42 42 0 1 1-31 28.5" fill="none" stroke="#d4a043" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="0" r="19" fill="#d4a043"/><circle cx="7" cy="-5" r="16" fill="#0a0a0a"/></g></svg> sawm <span>/ mosques</span></div>
  </div>
</div>

<div class="section fade-in">
  <div class="section-header">search radius <button class="refresh-btn" onclick={() => search(radius)} aria-label="Refresh"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 2v5h5"/><path d="M2.5 10.5a6.5 6.5 0 1 0 1-4.5L1 7"/></svg></button></div>
  <div class="radius-slider">
    <input
      type="range"
      min="1"
      max="25"
      step="1"
      value={radius}
      oninput={handleSlider}
      class="slider"
    >
    <div class="radius-value">{displayRadius} {unit}</div>
    <button class="unit-toggle" onclick={toggleUnit}>{unit === 'km' ? 'mi' : 'km'}</button>
  </div>
</div>

{#if loading}
  <div class="loading">
    <div class="loading-spinner"></div>
    <div>searching for mosques...</div>
  </div>
{:else if error}
  <div class="empty-state fade-in">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 4c-8 8-16 13-16 22a16 16 0 0032 0c0-9-8-14-16-22z"/>
      <circle cx="24" cy="26" r="4"/>
    </svg>
    <p>{error}</p>
  </div>
{:else}
  <div class="mosque-list fade-in">
    {#each mosques as mosque}
      <button class="mosque-card" onclick={() => openInMaps(mosque.lat, mosque.lng, mosque.name)}>
        <div class="mosque-name">{mosque.name}</div>
        {#if mosque.address}
          <div class="mosque-address">{mosque.address}</div>
        {/if}
        <div class="mosque-distance">{formatDistance(mosque.distance, unit)} away</div>
      </button>
    {/each}
  </div>
{/if}
