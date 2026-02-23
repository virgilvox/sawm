<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { getLocation } from '../stores/location.svelte.js';
  import { getAuth } from '../stores/auth.svelte.js';
  import { clasp } from '../lib/clasp.js';
  import { saveMessage, getMessages, cleanOldMessages } from '../lib/chatStore.js';

  const location = getLocation();
  const auth = getAuth();

  const ROOMS_KEY = 'sawm_chat_rooms';

  let messages = $state([]);
  let inputText = $state('');
  let messagesEl;
  let connected = $state(false);
  let rooms = $state([]);
  let activeRoom = $state(null);
  let showAddCity = $state(false);
  let cityInput = $state('');
  let stateInput = $state('');
  let onlineCount = $state(1);
  let typingUsers = $state([]);
  let typingCheckInterval;

  const displayName = $derived(auth.isAuthenticated ? (auth.user?.displayName || 'user') : 'anonymous');

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

  function addCity() {
    const city = cityInput.trim();
    const state = stateInput.trim();
    if (!city) return;
    const exists = rooms.some(r => r.city.toLowerCase() === city.toLowerCase() && r.state.toLowerCase() === state.toLowerCase());
    if (!exists) {
      rooms = [...rooms, { city, state, home: false }];
      saveRooms();
    }
    activeRoom = rooms.find(r => r.city.toLowerCase() === city.toLowerCase() && r.state.toLowerCase() === state.toLowerCase());
    cityInput = '';
    stateInput = '';
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
    if (!isHistory) scrollToBottom();
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

    // Load cached messages from IndexedDB
    const cached = await getMessages(addr);
    messages = cached;
    await tick();
    scrollToBottom();

    // Connect to clasp with all handlers
    await clasp.connect(addr, handleMessage, {
      displayName: displayName,
      onPresence: refreshStatus,
      onTyping: refreshStatus,
      onCount: refreshStatus,
    });

    // Check connection status after a moment
    setTimeout(refreshStatus, 2000);
  }

  function getRoomLabel(room) {
    return [room.city, room.state].filter(Boolean).join(', ').toLowerCase();
  }

  onMount(async () => {
    await cleanOldMessages();
    loadRooms();
    typingCheckInterval = setInterval(refreshStatus, 3000);
  });

  $effect(() => {
    if (location.city) {
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
    <div class="logo">sawm <span>/ chat</span></div>
  </div>
</div>

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
      <button class="chat-room-pill add-room" onclick={() => { showAddCity = !showAddCity; }} aria-label="Add city room">
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.5" fill="none">
          <path d="M5 1v8M1 5h8"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Add city form -->
  {#if showAddCity}
    <div class="add-city-form fade-in">
      <input
        class="add-city-input"
        type="text"
        placeholder="city name"
        bind:value={cityInput}
        onkeydown={(e) => { if (e.key === 'Enter') addCity(); }}
      >
      <input
        class="add-city-input"
        type="text"
        placeholder="state / region"
        bind:value={stateInput}
        onkeydown={(e) => { if (e.key === 'Enter') addCity(); }}
      >
      <button class="add-city-btn" onclick={addCity}>join</button>
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
      <div class="chat-presence">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle;margin-right:3px;">
          <circle cx="6" cy="4" r="2.5"/>
          <path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>
        </svg>
        {onlineCount}
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

  <!-- Input -->
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
</div>
