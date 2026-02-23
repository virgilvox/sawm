<script>
  import Term from './Term.svelte';

  let { guidance } = $props();

  // Group parts into paragraphs (split on break markers)
  const paragraphs = $derived.by(() => {
    if (!guidance?.parts) return [];
    const result = [[]];
    for (const part of guidance.parts) {
      if (part.break) {
        result.push([]);
      } else {
        result[result.length - 1].push(part);
      }
    }
    return result;
  });
</script>

<div class="section fade-in">
  <div class="section-header">right now</div>
  <div class="guidance">
    <div class="guidance-phase">{guidance.title}</div>
    <div class="guidance-text">
      {#each paragraphs as para}
        <p>
          {#each para as part}
            {#if part.isTerm}
              <Term word={part.text} />
            {:else}
              {part.text}
            {/if}
          {/each}
        </p>
      {/each}
    </div>
  </div>
</div>
