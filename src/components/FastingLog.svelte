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

  let completed = $state(false);
  let suhoorTime = $state('');
  let iftarTime = $state('');
  let notes = $state('');

  $effect(() => {
    if (data) {
      completed = data.completed || false;
      suhoorTime = data.suhoorTime || '';
      iftarTime = data.iftarTime || '';
      notes = data.notes || '';
    }
  });

  function save() {
    onsave({
      date: todayStr(),
      completed,
      suhoorTime,
      iftarTime,
      notes,
    });
    flashSaved();
  }

  function toggleFasted() {
    completed = !completed;
    save();
  }
</script>

<div class="section">
  <div class="section-header">fasting log {#if showSaved}<span class="save-indicator">saved</span>{/if}</div>
  <div class="fast-log">
    <button class="fast-toggle" class:active={completed} onclick={toggleFasted}>
      <div class="fast-toggle-switch"></div>
      <span class="fast-toggle-label">{completed ? 'fasted today' : 'did you fast today?'}</span>
    </button>

    {#if completed}
      <div class="fast-detail">
        <label for="suhoorTime">suhoor time</label>
        <input type="time" id="suhoorTime" bind:value={suhoorTime} onchange={save}>
      </div>
      <div class="fast-detail">
        <label for="iftarTime">iftar time</label>
        <input type="time" id="iftarTime" bind:value={iftarTime} onchange={save}>
      </div>
      <div class="fast-detail">
        <label for="fastNotes">notes (meals, how you felt)</label>
        <textarea id="fastNotes" bind:value={notes} onchange={save} placeholder="what did you eat? how was the fast?"></textarea>
      </div>
    {/if}
  </div>
</div>
