/**
 * IndexedDB-backed storage for high-resolution templates and custom frames.
 * Overcomes the 5MB browser quota limit of localStorage / sessionStorage.
 */

const DB_NAME = "temptree_db";
const DB_VERSION = 1;
const STORE_NAME = "templates";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTemplate(template: any): Promise<void> {
  if (!template || !template.id) return;

  // 1. Save to IndexedDB (virtually unlimited storage for multi-megabyte base64 images)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(template);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not save template to IndexedDB:", err);
  }

  // 2. Attempt sessionStorage as quick sync cache, safely catching 5MB quota errors
  try {
    sessionStorage.setItem(`temptree-template-${template.id}`, JSON.stringify(template));
    sessionStorage.setItem("temptree-active-template", JSON.stringify(template));
  } catch (storageErr) {
    // QuotaExceededError is normal for large 1080x1920 base64 images;
    // IndexedDB safely holds the complete uncompressed template.
  }
}

export async function getTemplate(templateId: string): Promise<any | null> {
  // 1. Primary retrieval from IndexedDB
  try {
    const db = await openDB();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(templateId);

      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });

    if (result) return result;
  } catch (err) {
    console.warn("IndexedDB read error, checking sessionStorage fallback:", err);
  }

  // 2. Fallback to sessionStorage
  try {
    if (typeof window !== "undefined") {
      const sessionData =
        sessionStorage.getItem(`temptree-template-${templateId}`) ||
        sessionStorage.getItem("temptree-active-template");

      if (sessionData) {
        return JSON.parse(sessionData);
      }
    }
  } catch (err) {
    console.warn("sessionStorage retrieval error:", err);
  }

  return null;
}
