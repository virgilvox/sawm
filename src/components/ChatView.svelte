<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { getLocation } from '../stores/location.svelte.js';
  import { getAuth } from '../stores/auth.svelte.js';
  import { clasp } from '../lib/clasp.js';
  import { saveMessage, getMessages, cleanOldMessages } from '../lib/chatStore.js';

  const location = getLocation();
  const auth = getAuth();

  const ROOMS_KEY = 'sawm_chat_rooms';
  const NICKNAME_KEY = 'sawm_chat_nickname';

  let messages = $state([]);
  let inputText = $state('');
  let messagesEl;
  let connected = $state(false);
  let rooms = $state([]);
  let activeRoom = $state(null);
  let showAddCity = $state(false);
  let searchQuery = $state('');
  let searchResults = $state([]);
  let searchLoading = $state(false);
  let searchTimer;
  let onlineCount = $state(1);
  let typingUsers = $state([]);
  let typingCheckInterval;
  let soundEnabled = $state(localStorage.getItem('sawm_chat_sound') !== 'off');

  function playNotif() {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => ctx.close(), 300);
    } catch (_) {}
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('sawm_chat_sound', soundEnabled ? 'on' : 'off');
  }
  let nickname = $state(localStorage.getItem(NICKNAME_KEY) || '');
  let nicknameInput = $state('');
  let showNicknamePrompt = $state(false);

  const displayName = $derived(
    auth.isAuthenticated
      ? (auth.user?.displayName || 'user')
      : (nickname || 'anonymous')
  );

  function setNickname() {
    const name = nicknameInput.trim().slice(0, 20);
    if (!name) return;
    nickname = name;
    localStorage.setItem(NICKNAME_KEY, name);
    showNicknamePrompt = false;
  }

  function clearNickname() {
    nickname = '';
    nicknameInput = '';
    localStorage.removeItem(NICKNAME_KEY);
    showNicknamePrompt = true;
  }

  function loadRooms() {
    try {
      const saved = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');
      if (saved.length) rooms = saved;
    } catch { rooms = []; }
  }

  function saveRooms() {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }

  function ensureHomeRoom() {
    if (!location.city) return;
    const exists = rooms.some(r => r.city.toLowerCase() === location.city.toLowerCase() && r.state.toLowerCase() === (location.state || '').toLowerCase());
    if (!exists) {
      rooms = [{ city: location.city, state: location.state || '', home: true }, ...rooms.map(r => ({ ...r, home: false }))];
      saveRooms();
    }
    if (!activeRoom) {
      activeRoom = rooms[0];
    }
  }

  function switchRoom(room) {
    if (activeRoom?.city === room.city && activeRoom?.state === room.state) return;
    activeRoom = room;
    messages = [];
    connectToRoom();
  }

  async function searchCities(q) {
    if (q.length < 2) { searchResults = []; return; }
    searchLoading = true;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=city`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      searchResults = data
        .filter(r => r.address && (r.address.city || r.address.town || r.address.village || r.name))
        .map(r => ({
          city: r.address.city || r.address.town || r.address.village || r.name,
          state: r.address.state || r.address.region || '',
          country: r.address.country || '',
        }))
        .filter((r, i, arr) => arr.findIndex(x => x.city === r.city && x.state === r.state) === i)
        .slice(0, 5);
    } catch (e) {
      searchResults = [];
    }
    searchLoading = false;
  }

  function handleSearchInput(e) {
    searchQuery = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchCities(searchQuery), 300);
  }

  function selectCity(result) {
    const city = result.city;
    const state = result.state;
    const exists = rooms.some(r => r.city.toLowerCase() === city.toLowerCase() && r.state.toLowerCase() === state.toLowerCase());
    if (!exists) {
      rooms = [...rooms, { city, state, home: false }];
      saveRooms();
    }
    activeRoom = rooms.find(r => r.city.toLowerCase() === city.toLowerCase() && r.state.toLowerCase() === state.toLowerCase());
    searchQuery = '';
    searchResults = [];
    showAddCity = false;
    messages = [];
    connectToRoom();
  }

  function removeRoom(room) {
    if (room.home) return;
    rooms = rooms.filter(r => !(r.city === room.city && r.state === room.state));
    saveRooms();
    if (activeRoom?.city === room.city && activeRoom?.state === room.state) {
      activeRoom = rooms[0] || null;
      messages = [];
      if (activeRoom) connectToRoom();
    }
  }

  async function handleMessage(msg, isHistory) {
    if (messages.some(m => m.id === msg.id)) return;
    messages = [...messages, msg].sort((a, b) => a.timestamp - b.timestamp);
    const addr = clasp.getRoomAddress(activeRoom.city, activeRoom.state);
    await saveMessage(addr, msg);
    await tick();
    if (!isHistory) {
      scrollToBottom();
      if (msg.clientId !== clasp.clientId) playNotif();
    }
  }

  function scrollToBottom() {
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text) return;
    clasp.send(text, displayName);
    inputText = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput() {
    clasp.startTyping();
  }

  function refreshStatus() {
    connected = clasp.isConnected();
    onlineCount = clasp.getPresenceCount();
    typingUsers = clasp.getTypingUsers();
  }

  async function connectToRoom() {
    if (!activeRoom) return;
    const addr = clasp.getRoomAddress(activeRoom.city, activeRoom.state);

    const cached = await getMessages(addr);
    messages = cached;
    await tick();
    scrollToBottom();

    await clasp.connect(addr, handleMessage, {
      displayName: displayName,
      onPresence: refreshStatus,
      onTyping: refreshStatus,
      onCount: refreshStatus,
    });

    setTimeout(refreshStatus, 2000);
  }

  function getRoomLabel(room) {
    return [room.city, room.state].filter(Boolean).join(', ').toLowerCase();
  }

  onMount(async () => {
    await cleanOldMessages();
    loadRooms();
    typingCheckInterval = setInterval(refreshStatus, 3000);
    if (!auth.isAuthenticated && !nickname) {
      showNicknamePrompt = true;
    }
  });

  let roomInitialized = false;
  $effect(() => {
    if (location.city && !roomInitialized) {
      roomInitialized = true;
      ensureHomeRoom();
      if (activeRoom) connectToRoom();
    }
  });

  onDestroy(() => {
    clasp.disconnect();
    clearInterval(typingCheckInterval);
  });
</script>

<div class="header fade-in">
  <div class="header-top">
    <div class="logo"><svg class="logo-icon" width="22" height="22" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="16" fill="#0a0a0a"/><g transform="translate(60,58)"><circle cx="0" cy="0" r="42" fill="none" stroke="#4a4a4a" stroke-width="5"/><path d="M0-42A42 42 0 1 1-31 28.5" fill="none" stroke="#d4a043" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="0" r="19" fill="#d4a043"/><circle cx="7" cy="-5" r="16" fill="#0a0a0a"/></g></svg> sawm <span>/ chat</span></div>
  </div>
</div>

{#if !auth.isAuthenticated}
  <div class="nickname-bar fade-in">
    {#if showNicknamePrompt}
      <div class="nickname-form">
        <input
          class="nickname-input"
          type="text"
          placeholder="pick a name..."
          maxlength="20"
          bind:value={nicknameInput}
          onkeydown={(e) => { if (e.key === 'Enter') setNickname(); }}
        >
        <button class="nickname-set-btn" onclick={setNickname}>go</button>
      </div>
      <div class="nickname-hint">name isn't reserved. sign in to claim one</div>
    {:else}
      <div class="nickname-display">
        chatting as <span class="nickname-value">{nickname || 'anonymous'}</span>
        <button class="nickname-change-btn" onclick={clearNickname}>change</button>
      </div>
    {/if}
  </div>
{/if}

<div class="chat-container fade-in">
  <!-- Room tabs -->
  <div class="chat-rooms-bar">
    <div class="chat-rooms-scroll">
      {#each rooms as room}
        <button
          class="chat-room-pill"
          class:active={activeRoom?.city === room.city && activeRoom?.state === room.state}
          onclick={() => switchRoom(room)}
        >
          {#if room.home}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" style="margin-right:4px;flex-shrink:0;">
              <path d="M1 5l4-3.5L9 5v4H6V7H4v2H1V5z"/>
            </svg>
          {/if}
          {getRoomLabel(room)}
          {#if !room.home}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              class="room-remove"
              onclick={(e) => { e.stopPropagation(); removeRoom(room); }}
              onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeRoom(room); } }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M1 1l6 6M7 1l-6 6"/>
              </svg>
            </span>
          {/if}
        </button>
      {/each}
      <button class="chat-room-pill add-room" onclick={() => { showAddCity = !showAddCity; searchQuery = ''; searchResults = []; }} aria-label="Add city room">
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.5" fill="none">
          <path d="M5 1v8M1 5h8"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Add city search -->
  {#if showAddCity}
    <div class="add-city-form fade-in">
      <div class="city-search-wrap">
        <input
          class="add-city-input"
          type="text"
          placeholder="search for a city..."
          value={searchQuery}
          oninput={handleSearchInput}
          autocomplete="off"
        >
        {#if searchResults.length > 0}
          <div class="city-results">
            {#each searchResults as result}
              <button class="city-result-item" onclick={() => selectCity(result)}>
                <span class="city-result-name">{result.city}</span>
                <span class="city-result-region">{[result.state, result.country].filter(Boolean).join(', ')}</span>
              </button>
            {/each}
          </div>
        {:else if searchQuery.length >= 2 && !searchLoading}
          <div class="city-results">
            <div class="city-result-empty">no results. try a different spelling</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Connection status + presence -->
  {#if activeRoom}
    <div class="chat-room-status">
      <div class="chat-room-name">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style="display:inline; vertical-align:middle; margin-right:6px;">
          <circle cx="4" cy="4" r="3" fill={connected ? 'var(--green)' : 'var(--text-dim)'}/>
        </svg>
        {getRoomLabel(activeRoom)}
      </div>
      <div class="chat-status-right">
        <button class="chat-sound-toggle" onclick={toggleSound} aria-label={soundEnabled ? 'Mute notifications' : 'Enable notifications'}>
          {#if soundEnabled}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 5.5h2l3-3v11l-3-3H3a1 1 0 01-1-1v-3a1 1 0 011-1z"/>
              <path d="M12 5.5a3.5 3.5 0 010 5"/>
              <path d="M14 3.5a6 6 0 010 9"/>
            </svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 5.5h2l3-3v11l-3-3H3a1 1 0 01-1-1v-3a1 1 0 011-1z"/>
              <path d="M11 5l4 6M15 5l-4 6"/>
            </svg>
          {/if}
        </button>
        <div class="chat-presence">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle;margin-right:3px;">
            <circle cx="6" cy="4" r="2.5"/>
            <path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>
          </svg>
          {onlineCount}
        </div>
      </div>
    </div>
  {/if}

  <!-- Messages -->
  <div class="chat-messages" bind:this={messagesEl}>
    {#if !activeRoom}
      <div class="empty-state">
        <p>detecting your location...</p>
      </div>
    {:else if !messages.length}
      <div class="empty-state">
        <p>no messages yet. be the first to say salam.</p>
      </div>
    {/if}
    {#each messages as msg}
      <div class="chat-msg" class:own={msg.clientId === clasp.clientId} class:other={msg.clientId !== clasp.clientId}>
        {#if msg.clientId !== clasp.clientId}
          <div class="chat-msg-sender">{msg.sender}</div>
        {/if}
        {msg.content}
        <div class="chat-msg-time">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    {/each}
  </div>

  <!-- Typing indicator -->
  {#if typingUsers.length > 0}
    <div class="chat-typing fade-in">
      {#if typingUsers.length === 1}
        {typingUsers[0]} is typing
      {:else if typingUsers.length === 2}
        {typingUsers[0]} and {typingUsers[1]} are typing
      {:else}
        {typingUsers.length} people are typing
      {/if}
      <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  {/if}

  <!-- Spacer for fixed input bar -->
  <div class="chat-input-spacer"></div>
</div>

<!-- Input: fixed above bottom nav -->
<div class="chat-input-bar">
  <input
    class="chat-input"
    type="text"
    placeholder="type a message..."
    bind:value={inputText}
    onkeydown={handleKeydown}
    oninput={handleInput}
    disabled={!activeRoom}
  >
  <button class="chat-send-btn" onclick={sendMessage} aria-label="Send message" disabled={!activeRoom}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 9l14-7-7 14v-7z"/>
    </svg>
  </button>
</div>
