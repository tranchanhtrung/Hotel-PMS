import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import fs from "fs";
import path from "path";

let dbInstance: any = null;
let isFirestoreAvailable = false;

export function getFirestoreDb() {
  if (dbInstance) return dbInstance;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      dbInstance = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
      isFirestoreAvailable = true;
      console.log(`[Firestore] Connected successfully to database ID: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);
    } else {
      console.warn("[Firestore] firebase-applet-config.json not found. Operating in fallback mode.");
    }
  } catch (err) {
    console.error("[Firestore] Initialization error:", err);
  }

  return dbInstance;
}

export function isDbConnected(): boolean {
  return isFirestoreAvailable && dbInstance !== null;
}

// Generic collection save
export async function saveCollectionItems<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving collection ${collectionName}:`, err);
    return false;
  }
}

// Single document save
export async function saveDocument<T>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data as any, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving doc ${collectionName}/${docId}:`, err);
    return false;
  }
}

// Delete single document
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error deleting doc ${collectionName}/${docId}:`, err);
    return false;
  }
}

// Fetch entire collection
export async function loadCollection<T>(collectionName: string): Promise<T[] | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    if (querySnapshot.empty) {
      return [];
    }
    const results: T[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    return results;
  } catch (err) {
    console.error(`[Firestore] Error loading collection ${collectionName}:`, err);
    return null;
  }
}

// Load single document
export async function loadDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  } catch (err) {
    console.error(`[Firestore] Error loading doc ${collectionName}/${docId}:`, err);
    return null;
  }
}
