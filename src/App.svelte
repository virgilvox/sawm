<script>
  import { onMount } from 'svelte';
  import BottomNav from './components/BottomNav.svelte';
  import FastingView from './components/FastingView.svelte';
  import TrackView from './components/TrackView.svelte';
  import MosqueView from './components/MosqueView.svelte';
  import ChatView from './components/ChatView.svelte';
  import Settings from './components/Settings.svelte';
  import AuthModal from './components/AuthModal.svelte';
  import { initLocation, getLocation } from './stores/location.js';
  import { loadPrayerTimes, getPrayerTimes } from './stores/prayerTimes.js';
  import { getAuth, initAuth, signOut } from './stores/auth.js';

  let activeTab = $state('home');
  let settingsOpen = $state(false);
  let authOpen = $state(false);

  const location = getLocation();
  const pt = getPrayerTimes();
  const auth = getAuth();

  onMount(async () => {
    initAuth(null);
    await initLocation();
    if (location.lat && location.lng) {
      await loadPrayerTimes(location.lat, location.lng);
    }
  });

  async function handleSettingsSave({ method, hydrationGoal }) {
    localStorage.setItem('sawm_hydration_goal', String(hydrationGoal));
    settingsOpen = false;
    if (location.lat && location.lng) {
      await loadPrayerTimes(location.lat, location.lng, method);
    }
  }

  function handleTabChange(tab) {
    activeTab = tab;
  }
</script>

{#if activeTab === 'home'}
  <FastingView onsettingsopen={() => settingsOpen = true} onauthopen={() => authOpen = true} />
{:else if activeTab === 'track'}
  <TrackView onauthopen={() => authOpen = true} />
{:else if activeTab === 'mosques'}
  <MosqueView />
{:else if activeTab === 'chat'}
  <ChatView />
{/if}

<BottomNav {activeTab} ontabchange={handleTabChange} />

<Settings
  open={settingsOpen}
  method={pt.method}
  hydrationGoal={parseInt(localStorage.getItem('sawm_hydration_goal') || '8')}
  onclose={() => settingsOpen = false}
  onsave={handleSettingsSave}
/>

<AuthModal
  open={authOpen}
  onclose={() => authOpen = false}
/>
