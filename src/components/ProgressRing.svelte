<script>
  let { progress = 0, time = '', label = '', sub = '', phase = 'fasting' } = $props();

  const radius = 110;
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference * (1 - progress));
  const ringColor = $derived(phase === 'fasting' ? 'var(--amber)' : 'var(--green)');
</script>

<div class="ring-container">
  <svg class="ring-svg" viewBox="0 0 260 260">
    <circle class="ring-bg" cx="130" cy="130" r={radius} />
    <circle
      class="ring-progress"
      cx="130" cy="130" r={radius}
      stroke={ringColor}
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
    />
  </svg>
  <div class="ring-center">
    <div class="ring-time">{time}</div>
    <div class="ring-label">{label}</div>
    <div class="ring-sub">{sub}</div>
  </div>
</div>
