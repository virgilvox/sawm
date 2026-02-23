<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { getLocation } from '../stores/location.svelte.js';
  import { getAuth } from '../stores/auth.svelte.js';
  import { clasp } from '../lib/clasp.js';
  import { saveMessage, getMessages, cleanOldMessages } from '../lib/chatStore.js';

  const location = getLocation();
  const auth = getAuth();

  let messages = $state([]);
  let inputText = $state('');
  let messagesEl;
  let connected = $state(false);

  const roomAddress = $derived(clasp.getRoomAddress(location.city, location.state));
  const roomDisplay = $derived(
    location.city
      ? `${location.city}, ${location.state}`.toLowerCase()
      : 'connecting...'
  );
  const displayName = $derived(auth.isAuthenticated ? (auth.user?.displayName || 'user') : 'anonymous');

  async function handleMessage(msg) {
    // Avoid duplicates
    if (messages.some(m => m.id === msg.id)) return;
    messages = [...messages, msg];
    await saveMessage(roomAddress, msg);
    await tick();
    scrollToBottom();
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

  onMount(async () => {
    await cleanOldMessages();
  });

  // Connect when room is available
  $effect(() => {
    if (roomAddress) {
      // Load cached messages
      getMessages(roomAddress).then(cached => {
        messages = cached;
        tick().then(scrollToBottom);
      });
      clasp.connect(roomAddress, handleMessage);
      connected = true;
    }
  });

  onDestroy(() => {
    clasp.disconnect();
  });
</script>

<div class="header fade-in">
  <div class="header-top">
    <div class="logo">sawm <span>/ chat</span></div>
  </div>
</div>

<div class="chat-container fade-in">
  <div class="chat-room-name">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="display:inline; vertical-align:middle; margin-right:6px;">
      <circle cx="5" cy="5" r="3" fill={connected ? 'var(--green)' : 'var(--red)'}/>
    </svg>
    {roomDisplay}
  </div>

  <div class="chat-messages" bind:this={messagesEl}>
    {#if !messages.length}
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

  <div class="chat-input-bar">
    <input
      class="chat-input"
      type="text"
      placeholder="type a message..."
      bind:value={inputText}
      onkeydown={handleKeydown}
    >
    <button class="chat-send-btn" onclick={sendMessage} aria-label="Send message">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 9l14-7-7 14v-7z"/>
      </svg>
    </button>
  </div>
</div>
