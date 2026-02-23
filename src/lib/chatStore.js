const DB_NAME = 'sawm_chat';
const DB_VERSION = 1;
const STORE_NAME = 'messages';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_room', 'room', { unique: false });
        store.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMessage(room, msg) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.put({ ...msg, room });
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessages(room, limit = 100) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('by_room');
  const request = index.getAll(room);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const msgs = request.result
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-limit);
      resolve(msgs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function cleanOldMessages() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const cutoff = Date.now() - MAX_AGE_MS;

  const request = store.openCursor();
  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.timestamp < cutoff) {
        cursor.delete();
      }
      cursor.continue();
    }
  };
}
