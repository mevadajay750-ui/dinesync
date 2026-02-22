import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
  type Timestamp,
  type WriteBatch,
} from "firebase/firestore";
import { getFirebaseFirestore } from "./config";

export const db = getFirebaseFirestore();

export function createBatch(): WriteBatch {
  return writeBatch(db);
}

export function getCollectionRef<T extends DocumentData>(path: string): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>;
}

export function getDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  return doc(db, path, ...pathSegments);
}

export async function getDocument<T>(path: string, ...pathSegments: string[]): Promise<T | null> {
  const ref = getDocRef(path, ...pathSegments);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function getDocuments<T>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const ref = getCollectionRef(path);
  const q = constraints.length > 0 ? query(ref, ...constraints) : query(ref);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

export async function setDocument(path: string, data: DocumentData, ...pathSegments: string[]) {
  const ref = pathSegments.length > 0 ? getDocRef(path, ...pathSegments) : getDocRef(path);
  await setDoc(ref, data, { merge: true });
}

export async function addDocument(path: string, data: DocumentData) {
  const ref = getCollectionRef(path);
  return addDoc(ref, data);
}

export async function updateDocument(path: string, data: Partial<DocumentData>, ...pathSegments: string[]) {
  const ref = getDocRef(path, ...pathSegments);
  await updateDoc(ref, data);
}

export async function deleteDocument(path: string, ...pathSegments: string[]) {
  const ref = getDocRef(path, ...pathSegments);
  await deleteDoc(ref);
}

export { where, orderBy, limit };
export type { Timestamp, WriteBatch };
