import { ClaspBuilder } from '@clasp-to/core';

const RELAY_URL = 'wss://relay.clasp.to';
const MAX_HISTORY = 20;

// Suppress noisy clasp ACK debug logs
const _debug = console.debug;
console.debug = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith('CLASP')) return;
  _debug.apply(console, args);
};

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

// Local state tracked from subscription callbacks
const presenceMap = new Map();  // address -> { name, since }
const typingMap = new Map();    // address -> { name, at }

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

  presenceMap.clear();
  typingMap.clear();

  try {
    client = await new ClaspBuilder(RELAY_URL)
      .withName(`sawm-${clientId.slice(0, 8)}`)
      .withFeatures(['param', 'event'])
      .withReconnect(true)
      .connect();

    // Subscribe to chat messages (ephemeral EMIT events)
    const unMsg = client.on(roomAddr(room, 'messages'), (payload) => {
      if (!messageHandler || !payload) return;
      if (payload.id && payload.content) {
        messageHandler(payload, false);
      }
    });
    unsubs.push(unMsg);

    // Subscribe to presence (stateful SET params)
    const unPresence = client.subscribe(roomAddr(room, 'presence/*'), (value, address) => {
      if (value && value.name) {
        presenceMap.set(address, value);
      } else {
        presenceMap.delete(address);
      }
      if (presenceHandler) presenceHandler();
      if (countHandler) countHandler();
    });
    unsubs.push(unPresence);

    // Subscribe to typing indicators (stateful SET params)
    const unTyping = client.subscribe(roomAddr(room, 'typing/*'), (value, address) => {
      if (value && value.name) {
        typingMap.set(address, value);
      } else {
        typingMap.delete(address);
      }
      if (typingHandler) typingHandler();
    });
    unsubs.push(unTyping);

    // Subscribe to message history (stateful SET param for late joiners)
    // subscribe() delivers a SNAPSHOT of current value on connect
    const historyAddr = roomAddr(room, 'history');
    const unHistory = client.subscribe(historyAddr, (value) => {
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

  } catch (e) {
    console.warn('clasp connect failed:', e);
  }
}

function disconnect() {
  if (client && client.connected && currentRoom) {
    try {
      client.set(roomAddr(currentRoom, `presence/${clientId}`), null);
      client.set(roomAddr(currentRoom, `typing/${clientId}`), null);
    } catch (e) { /* ignore */ }
  }

  unsubs.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
  unsubs = [];

  clearInterval(presenceInterval);
  clearTimeout(typingTimer);
  presenceInterval = null;
  typingTimer = null;

  presenceMap.clear();
  typingMap.clear();

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
  // Count from locally tracked presence map
  return Math.max(presenceMap.size, 1);
}

function getTypingUsers() {
  const users = [];
  const now = Date.now();
  for (const [address, val] of typingMap) {
    if (val && val.name && val.at && (now - val.at) < 5000) {
      // Don't show ourselves typing
      if (!address.endsWith(`/${clientId}`)) {
        users.push(val.name);
      }
    }
  }
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
