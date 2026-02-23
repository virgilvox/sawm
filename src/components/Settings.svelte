<script>
  let { open = false, method = 2, hydrationGoal = 8, onclose, onsave } = $props();

  let localMethod = $state(2);
  let localGoal = $state(8);

  $effect(() => {
    localMethod = method;
    localGoal = hydrationGoal;
  });

  function handleSave() {
    onsave({
      method: parseInt(localMethod),
      hydrationGoal: Math.max(4, Math.min(parseInt(localGoal) || 8, 16)),
    });
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onclose();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose();
  }

  const methods = [
    { value: 2, label: 'Islamic Society of North America (ISNA)' },
    { value: 3, label: 'Muslim World League' },
    { value: 4, label: 'Umm al-Qura, Makkah' },
    { value: 5, label: 'Egyptian General Authority' },
    { value: 1, label: 'University of Islamic Sciences, Karachi' },
    { value: 0, label: 'Jafari / Shia Ithna-Ashari' },
    { value: 7, label: 'Institute of Geophysics, Tehran' },
    { value: 8, label: 'Gulf Region' },
    { value: 9, label: 'Kuwait' },
    { value: 10, label: 'Qatar' },
    { value: 11, label: 'Majlis Ugama Islam Singapura' },
    { value: 12, label: 'UOIF (France)' },
    { value: 13, label: 'DIANET (Turkey)' },
    { value: 14, label: 'Spiritual Admin of Russia' },
    { value: 15, label: 'Moonsighting Committee Worldwide' },
  ];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" class:open onclick={handleOverlayClick} onkeydown={handleKeydown}>
  <div class="modal">
    <h3>settings</h3>
    <label for="calcMethod">calculation method</label>
    <select id="calcMethod" bind:value={localMethod}>
      {#each methods as m}
        <option value={m.value}>{m.label}</option>
      {/each}
    </select>
    <label for="hydGoal">hydration goal (cups)</label>
    <input type="number" id="hydGoal" min="4" max="16" bind:value={localGoal}>
    <div class="modal-btns">
      <button onclick={onclose}>cancel</button>
      <button class="save" onclick={handleSave}>save</button>
    </div>
  </div>
</div>
