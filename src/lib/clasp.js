const RELAY_URL = 'wss://relay.clasp.chat';

let ws = null;
let currentRoom = '';
let messageHandler = null;
let reconnectTimer = null;
let clientId = localStorage.getItem('sawm_client_id') || crypto.randomUUID();
localStorage.setItem('sawm_client_id', clientId);

function connect(room, onMessage) {
  if (ws && ws.readyState === WebSocket.OPEN && currentRoom === room) return;
  disconnect();

  currentRoom = room;
  messageHandler = onMessage;

  try {
    ws = new WebSocket(`${RELAY_URL}/${encodeURIComponent(room)}`);

    ws.onopen = () => {
      clearTimeout(reconnectTimer);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (messageHandler) messageHandler(msg);
      } catch (e) {
        // non-JSON message, ignore
      }
    };

    ws.onclose = () => {
      scheduleReconnect(room, onMessage);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch (e) {
    scheduleReconnect(room, onMessage);
  }
}

function scheduleReconnect(room, onMessage) {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (currentRoom === room) {
      connect(room, onMessage);
    }
  }, 3000);
}

function disconnect() {
  clearTimeout(reconnectTimer);
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }
  currentRoom = '';
  messageHandler = null;
}

function send(content, displayName) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;

  const msg = {
    id: crypto.randomUUID(),
    clientId,
    sender: displayName || 'anonymous',
    content,
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(msg));
  // Also pass to our own handler for local display
  if (messageHandler) messageHandler(msg);
  return true;
}

function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

function getRoomAddress(city, state) {
  if (!city) return '';
  const c = city.toLowerCase().replace(/\s+/g, '-');
  const s = (state || '').toLowerCase().replace(/\s+/g, '-');
  return `sawm-app-chats/${c}/${s}`;
}

export const clasp = {
  connect,
  disconnect,
  send,
  isConnected,
  getRoomAddress,
  get clientId() { return clientId; },
};
