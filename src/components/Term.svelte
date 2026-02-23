<script>
  import { GLOSSARY } from '../lib/glossary.js';

  let { word } = $props();
  const def = $derived(GLOSSARY[word] || '');
</script>

{#if def}
  <button class="term" type="button" aria-label="{word}: {def}">
    {word}
    <span class="tooltip">{def}</span>
  </button>
{:else}
  {word}
{/if}
