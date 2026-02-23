<script>
  let { locationName = '', error = false, onclick } = $props();
</script>

<button class="location-bar fade-in" onclick={onclick}>
  <div class="location-dot" class:error></div>
  <div class="location-text">{locationName || 'locating...'}</div>
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-dim)" stroke-width="1.2">
    <circle cx="7" cy="7" r="5.5"/>
    <path d="M7 4v6M4 7h6" stroke-linecap="round"/>
  </svg>
</button>
