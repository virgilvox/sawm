<script>
  import { GLOSSARY } from '../lib/glossary.js';

  let open = $state(false);
  const entries = Object.entries(GLOSSARY);
</script>

<div class="section fade-in">
  <div class="section-header">glossary / new to this?</div>
  <button class="glossary-toggle" class:open onclick={() => open = !open}>
    <span>tap to see terms explained in plain language</span>
    <span class="arrow">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </button>
  <div class="glossary-content" class:open>
    <div class="glossary-list">
      {#each entries as [term, def]}
        <div class="glossary-entry">
          <div class="glossary-term">{term}</div>
          <div class="glossary-def">{def}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
