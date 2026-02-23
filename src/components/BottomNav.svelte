<script>
  let { activeTab = 'home', ontabchange } = $props();

  const tabs = [
    { id: 'home', label: 'home' },
    { id: 'track', label: 'track' },
    { id: 'mosques', label: 'mosques' },
    { id: 'chat', label: 'chat' },
  ];
</script>

<nav class="bottom-nav">
  {#each tabs as tab}
    <button class="nav-item" class:active={activeTab === tab.id} onclick={() => ontabchange(tab.id)}>
      {#if tab.id === 'home'}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10l7-7 7 7"/>
          <path d="M5 8v8a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V8"/>
        </svg>
      {:else if tab.id === 'track'}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="14" height="14" rx="2"/>
          <path d="M7 10l2 2 4-4"/>
        </svg>
      {:else if tab.id === 'mosques'}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2c-3 3-6 5-6 8a6 6 0 0012 0c0-3-3-5-6-8z"/>
          <circle cx="10" cy="10" r="2"/>
        </svg>
      {:else if tab.id === 'chat'}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-3 3V5a1 1 0 011-1z"/>
        </svg>
      {/if}
      {tab.label}
    </button>
  {/each}
</nav>
