import { ClaspBuilder } from '@clasp-to/core';

const RELAY_URL = 'wss://relay.clasp.to';
const MAX_HISTORY = 20;

let client = null;
let currentRoom = '';
let messageHandler = null;
let presenceHandler = null;
let typingHandler = null;
let countHandler = null;
let clientId = localStorage.getItem('sawm_client_id') || crypto.randomUUID();
localStorage.setItem('sawm_client_id', clientId);

let unsubs = [];
let typingTimer = null;
let presenceInterval = null;
let _displayName = 'anonymous';

function roomAddr(room, path) {
  return `/chat/room/${room}/${path}`;
}

async function connect(room, onMessage, opts = {}) {
  if (client && client.connected && currentRoom === room) return;
  disconnect();

  currentRoom = room;
  messageHandler = onMessage;
  presenceHandler = opts.onPresence || null;
  typingHandler = opts.onTyping || null;
  countHandler = opts.onCount || null;
  _displayName = opts.displayName || 'anonymous';

  try {
    client = await new ClaspBuilder(RELAY_URL)
      .withName(`sawm-${clientId.slice(0, 8)}`)
      .withFeatures(['param', 'event'])
      .withReconnect(true, 3000)
      .connect();

    // Subscribe to chat messages (ephemeral events)
    const unMsg = client.on(roomAddr(room, 'messages'), (value, address) => {
      if (!messageHandler || !value) return;
      // value is the message object emitted
      if (value.id && value.content) {
        messageHandler(value, false);
      }
    });
    unsubs.push(unMsg);

    // Subscribe to presence (stateful SET - who's online)
    const unPresence = client.on(roomAddr(room, 'presence/*'), (value, address) => {
      if (presenceHandler) presenceHandler();
      if (countHandler) countHandler();
    });
    unsubs.push(unPresence);

    // Subscribe to typing indicators (stateful SET)
    const unTyping = client.on(roomAddr(room, 'typing/*'), (value, address) => {
      if (typingHandler) typingHandler();
    });
    unsubs.push(unTyping);

    // Subscribe to message history (stateful SET for late joiners)
    const unHistory = client.on(roomAddr(room, 'history'), (value, address) => {
      if (!messageHandler || !value) return;
      if (Array.isArray(value)) {
        value.forEach(msg => {
          if (msg && msg.id && msg.content) {
            messageHandler(msg, true);
          }
        });
      }
    });
    unsubs.push(unHistory);

    // Announce our presence
    setPresence(true);
    presenceInterval = setInterval(() => setPresence(true), 30000);

    // Request current history state
    try {
      const history = await client.get(roomAddr(room, 'history'));
      if (Array.isArray(history) && messageHandler) {
        history.forEach(msg => {
          if (msg && msg.id && msg.content) {
            messageHandler(msg, true);
          }
        });
      }
    } catch (e) {
      // No history yet, that's fine
    }

  } catch (e) {
    console.warn('clasp connect failed:', e);
    // Will auto-reconnect via ClaspBuilder config
  }
}

function disconnect() {
  // Clear presence
  if (client && client.connected && currentRoom) {
    try {
      client.set(roomAddr(currentRoom, `presence/${clientId}`), null);
      client.set(roomAddr(currentRoom, `typing/${clientId}`), null);
    } catch (e) { /* ignore */ }
  }

  // Unsubscribe all
  unsubs.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
  unsubs = [];

  clearInterval(presenceInterval);
  clearTimeout(typingTimer);
  presenceInterval = null;
  typingTimer = null;

  if (client) {
    client.close();
    client = null;
  }
  currentRoom = '';
  messageHandler = null;
  presenceHandler = null;
  typingHandler = null;
  countHandler = null;
}

function send(content, displayName) {
  if (!client || !client.connected || !currentRoom) return false;

  const msg = {
    id: crypto.randomUUID(),
    clientId,
    sender: displayName || _displayName,
    content,
    timestamp: Date.now(),
  };

  // Emit ephemeral message to all subscribers
  client.emit(roomAddr(currentRoom, 'messages'), msg);

  // Update persistent history (last N messages for late joiners)
  updateHistory(msg);

  // Clear typing indicator
  setTyping(false);

  // Show locally immediately
  if (messageHandler) messageHandler(msg, false);
  return true;
}

function updateHistory(newMsg) {
  const cacheKey = `sawm_history_${currentRoom}`;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(cacheKey) || '[]');
  } catch (e) { history = []; }

  history.push(newMsg);
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);
  }

  localStorage.setItem(cacheKey, JSON.stringify(history));

  // Persist on the relay as stateful param (late joiners get this via snapshot)
  if (client && client.connected) {
    client.set(roomAddr(currentRoom, 'history'), history);
  }
}

function setPresence(online) {
  if (!client || !client.connected || !currentRoom) return;
  client.set(roomAddr(currentRoom, `presence/${clientId}`), online ? {
    name: _displayName,
    since: Date.now(),
  } : null);
}

function setTyping(isTyping) {
  if (!client || !client.connected || !currentRoom) return;
  client.set(roomAddr(currentRoom, `typing/${clientId}`), isTyping ? {
    name: _displayName,
    at: Date.now(),
  } : null);
}

function startTyping() {
  setTyping(true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => setTyping(false), 4000);
}

function isConnected() {
  return client && client.connected;
}

function getPresenceCount() {
  // Count presence params from cache
  if (!client || !currentRoom) return 0;
  let count = 0;
  // We can check cached presence values
  // The subscriptions will have populated the client's param cache
  // For now, return a simple count based on cached values
  try {
    const signals = client.querySignals(roomAddr(currentRoom, 'presence/*'));
    count = signals.length;
  } catch (e) {
    count = 0;
  }
  return Math.max(count, 1); // At least us
}

function getTypingUsers() {
  if (!client || !currentRoom) return [];
  const users = [];
  try {
    const now = Date.now();
    const signals = client.querySignals(roomAddr(currentRoom, 'typing/*'));
    for (const sig of signals) {
      const val = client.cached(sig.address);
      if (val && val.name && val.at && (now - val.at) < 5000) {
        // Don't show ourselves typing
        if (!sig.address.endsWith(`/${clientId}`)) {
          users.push(val.name);
        }
      }
    }
  } catch (e) { /* ignore */ }
  return users;
}

function getRoomAddress(city, state) {
  if (!city) return '';
  const c = city.toLowerCase().replace(/\s+/g, '-');
  const s = (state || '').toLowerCase().replace(/\s+/g, '-');
  return `sawm/${c}/${s}`;
}

function getRoomLabel(city, state) {
  return [city, state].filter(Boolean).join(', ').toLowerCase();
}

export const clasp = {
  connect,
  disconnect,
  send,
  isConnected,
  startTyping,
  setTyping,
  getPresenceCount,
  getTypingUsers,
  getRoomAddress,
  getRoomLabel,
  get clientId() { return clientId; },
  get currentRoom() { return currentRoom; },
};
