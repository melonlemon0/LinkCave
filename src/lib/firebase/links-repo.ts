import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { sortActiveShelfLinks, sortFrozenShelfLinks } from "@/lib/linkfridge/sort-shelf-links";
import { TRASH_RETENTION_MS, type FridgeLink, type FrozenZone } from "@/types/linkfridge";
import { getFirestoreDb } from "./config";

function linksCol(uid: string) {
  return collection(getFirestoreDb(), "users", uid, "links");
}

export function mapLinkDoc(id: string, data: DocumentData): FridgeLink {
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
  const trashedAt =
    data.trashedAt instanceof Timestamp ? data.trashedAt.toMillis() : data.trashedAt ?? null;
  const offsets = Array.isArray(data.reminderFiredOffsets)
    ? data.reminderFiredOffsets.filter((n: unknown) => typeof n === "number")
    : [];
  const rawState = data.state;
  const state: FridgeLink["state"] =
    rawState === "trashed" ? "trashed" : rawState === "frozen" ? "frozen" : "active";

  const frozenAtRaw =
    data.frozenAt instanceof Timestamp ? data.frozenAt.toMillis() : data.frozenAt;
  let frozenAt: number | null = null;
  if (state === "frozen") {
    frozenAt = typeof frozenAtRaw === "number" && Number.isFinite(frozenAtRaw) ? frozenAtRaw : createdAt;
  }

  const rawZone = data.frozenZone;
  let frozenZone: FrozenZone | null = null;
  if (state === "frozen") {
    frozenZone =
      rawZone === "meat" || rawZone === "fruit" || rawZone === "freezer" ? rawZone : "freezer";
  }

  return {
    id,
    url: String(data.url ?? ""),
    title: String(data.title ?? ""),
    thumbnailUrl:
      data.thumbnailUrl === null || data.thumbnailUrl === undefined
        ? null
        : String(data.thumbnailUrl),
    createdAt,
    state,
    trashedAt: typeof trashedAt === "number" ? trashedAt : null,
    frozenAt,
    frozenZone,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    pinned: data.pinned === true,
    reminderFiredOffsets: offsets,
  };
}

export function subscribeActiveLinks(
  uid: string,
  onLinks: (links: FridgeLink[]) => void
): Unsubscribe {
  const q = query(
    linksCol(uid),
    where("state", "==", "active"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const links = snap.docs.map((d) => mapLinkDoc(d.id, d.data()));
    onLinks(sortActiveShelfLinks(links));
  });
}

export function subscribeFrozenLinks(
  uid: string,
  onLinks: (links: FridgeLink[]) => void
): Unsubscribe {
  const q = query(
    linksCol(uid),
    where("state", "==", "frozen"),
    orderBy("frozenAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const links = snap.docs.map((d) => mapLinkDoc(d.id, d.data()));
    onLinks(sortFrozenShelfLinks(links));
  });
}

export function subscribeTrashedLinks(
  uid: string,
  onLinks: (links: FridgeLink[]) => void
): Unsubscribe {
  const q = query(
    linksCol(uid),
    where("state", "==", "trashed"),
    orderBy("trashedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    onLinks(snap.docs.map((d) => mapLinkDoc(d.id, d.data())));
  });
}

export async function addUserLink(
  uid: string,
  input: { url: string; title: string; thumbnailUrl: string | null }
): Promise<string> {
  const ref = await addDoc(linksCol(uid), {
    url: input.url,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl,
    state: "active",
    trashedAt: null,
    frozenAt: null,
    frozenZone: null,
    sortOrder: Date.now(),
    pinned: false,
    reminderFiredOffsets: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLinkDetails(
  uid: string,
  linkId: string,
  patch: { title: string; url: string }
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    title: patch.title.slice(0, 500),
    url: patch.url.trim().slice(0, 4000),
    updatedAt: serverTimestamp(),
  });
}

export async function setLinkPinned(uid: string, linkId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    pinned,
    updatedAt: serverTimestamp(),
  });
}

export async function softTrashLink(uid: string, linkId: string): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    state: "trashed",
    trashedAt: serverTimestamp(),
    frozenAt: null,
    frozenZone: null,
    updatedAt: serverTimestamp(),
  });
}

export async function freezeLink(
  uid: string,
  linkId: string,
  zone: FrozenZone = "freezer"
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    state: "frozen",
    frozenAt: serverTimestamp(),
    frozenZone: zone,
    trashedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/** Move between cold shelves without changing `frozenAt`. */
export async function setFrozenZone(uid: string, linkId: string, zone: FrozenZone): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    frozenZone: zone,
    updatedAt: serverTimestamp(),
  });
}

export async function unfreezeLink(uid: string, linkId: string): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    state: "active",
    frozenAt: null,
    frozenZone: null,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreLink(uid: string, linkId: string): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    state: "active",
    trashedAt: null,
    frozenAt: null,
    frozenZone: null,
    updatedAt: serverTimestamp(),
  });
}

/** Remove a link document (e.g. from trash). Cannot be undone. */
export async function permanentDeleteLink(uid: string, linkId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), "users", uid, "links", linkId));
}

export async function recordReminderFired(
  uid: string,
  linkId: string,
  offset: number
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid, "links", linkId), {
    reminderFiredOffsets: arrayUnion(offset),
    updatedAt: serverTimestamp(),
  });
}

/** Permanently remove trashed links older than retention window. */
export async function purgeExpiredTrash(uid: string): Promise<void> {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  const q = query(linksCol(uid), where("state", "==", "trashed"));
  const snap = await getDocs(q);
  const db = getFirestoreDb();
  for (const d of snap.docs) {
    const data = d.data();
    const trashedAt = data.trashedAt instanceof Timestamp ? data.trashedAt.toMillis() : null;
    if (typeof trashedAt === "number" && trashedAt < cutoff) {
      await deleteDoc(doc(db, "users", uid, "links", d.id));
    }
  }
}
