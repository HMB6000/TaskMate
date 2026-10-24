/**
 * Firestore data layer. Every read/write the app does in "live" mode lives here,
 * so the shape of the database (and what firestore.rules must allow) is in one place.
 *
 *   users/{uid}                          private profile: name, email, prefs, projectIds
 *   users/{uid}/notifications/{id}       that user's notifications
 *   invites/{code}                       { projectId } so people can join with a code
 *   projects/{pid}                       name, ownerId, inviteCode, createdAt
 *   projects/{pid}/members/{uid}         public member card: name, role, color, lastActive
 *   projects/{pid}/tasks/{tid}           task fields (+ embedded subtasks, soft "deleted" flag)
 *   projects/{pid}/comments/{cid}        comments and system messages, keyed by taskId
 *   projects/{pid}/activity/{id}         activity feed
 */
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  DEFAULT_PREFS, MEMBER_COLORS,
  type Activity, type Comment, type Member, type Notif, type NotifKind, type Prefs, type Project, type Status, type Subtask, type Task,
} from "./data";

const now = () => new Date().toISOString();
export const newId = () => doc(collection(db, "_")).id;

/** 8-character invite code without look-alike characters (0/O, 1/I/L). */
export function makeInviteCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const colorFor = (uid: string) => MEMBER_COLORS[[...uid].reduce((a, c) => a + c.charCodeAt(0), 0) % MEMBER_COLORS.length];

/* ------------------------------------------------------------------ users */

export interface UserProfile {
  name: string;
  email: string;
  prefs: Prefs;
  projectIds: string[];
  createdAt: string;
}

export async function createUserProfile(uid: string, name: string, email: string) {
  const profile: UserProfile = { name, email, prefs: DEFAULT_PREFS, projectIds: [], createdAt: now() };
  await setDoc(doc(db, "users", uid), profile);
}

/** Creates the profile if it is missing (e.g. sign-up was interrupted). */
export async function ensureUserProfile(uid: string, name: string, email: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) await createUserProfile(uid, name, email);
}

export const subscribeProfile = (uid: string, cb: (p: UserProfile | null) => void) =>
  onSnapshot(doc(db, "users", uid), (s) => cb(s.exists() ? (s.data() as UserProfile) : null));

export const savePrefs = (uid: string, prefs: Prefs) => updateDoc(doc(db, "users", uid), { prefs });

/* --------------------------------------------------------------- projects */

export async function createProject(uid: string, userName: string, name: string, role: string) {
  const pid = newId();
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(doc(db, "projects", pid), { name, ownerId: uid, inviteCode: code, createdAt: now() });
  batch.set(doc(db, "projects", pid, "members", uid), {
    uid, name: userName, role, color: colorFor(uid), joinedAt: now(), lastActive: now(), inviteCode: code,
  });
  batch.set(doc(db, "invites", code), { projectId: pid });
  batch.update(doc(db, "users", uid), { projectIds: arrayUnion(pid) });
  await batch.commit();
  return pid;
}

export class JoinError extends Error {}

export async function joinProject(uid: string, userName: string, rawCode: string, role: string) {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const invite = await getDoc(doc(db, "invites", code));
  if (!invite.exists()) throw new JoinError("That invite code doesn't match any project. Check it with your teammate.");
  const pid = (invite.data() as { projectId: string }).projectId;
  const batch = writeBatch(db);
  batch.set(doc(db, "projects", pid, "members", uid), {
    uid, name: userName, role, color: colorFor(uid), joinedAt: now(), lastActive: now(), inviteCode: code,
  });
  batch.update(doc(db, "users", uid), { projectIds: arrayUnion(pid) });
  await batch.commit();
  return pid;
}

export async function leaveProject(uid: string, pid: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "projects", pid, "members", uid));
  batch.update(doc(db, "users", uid), { projectIds: arrayRemove(pid) });
  await batch.commit();
}

/** Owner only: invalidates the old code so it can no longer be used to join. */
export async function regenerateInvite(project: Project) {
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.update(doc(db, "projects", project.id), { inviteCode: code });
  batch.delete(doc(db, "invites", project.inviteCode));
  batch.set(doc(db, "invites", code), { projectId: project.id });
  await batch.commit();
}

export const renameProject = (pid: string, name: string) => updateDoc(doc(db, "projects", pid), { name });

/** One-off fetch of the user's projects for the picker. Projects they can no longer read are skipped. */
export async function fetchProjects(ids: string[]): Promise<Project[]> {
  const res = await Promise.all(
    ids.map((id) =>
      getDoc(doc(db, "projects", id))
        .then((s) => (s.exists() ? ({ id, ...s.data() } as Project) : null))
        .catch(() => null),
    ),
  );
  return res.filter((p): p is Project => p !== null);
}

export const subscribeProject = (pid: string, cb: (p: Project | null) => void, onErr: (e: Error) => void) =>
  onSnapshot(doc(db, "projects", pid), (s) => cb(s.exists() ? ({ id: s.id, ...s.data() } as Project) : null), onErr);

/* ---------------------------------------------------------------- members */

const ONLINE_MS = 5 * 60 * 1000;

export const subscribeMembers = (pid: string, cb: (m: Member[]) => void) =>
  onSnapshot(collection(db, "projects", pid, "members"), (snap) =>
    cb(
      snap.docs
        .map((d) => {
          const x = d.data();
          return {
            id: d.id,
            name: x.name as string,
            role: x.role as string,
            color: x.color as string,
            online: Date.now() - new Date(x.lastActive as string).getTime() < ONLINE_MS,
            joinedAt: x.joinedAt as string,
          };
        })
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
        .map(({ joinedAt: _j, ...m }) => m),
    ),
  );

export const heartbeat = (pid: string, uid: string) =>
  updateDoc(doc(db, "projects", pid, "members", uid), { lastActive: now() }).catch(() => {});

export const updateMember = (pid: string, uid: string, fields: { name?: string; role?: string }) =>
  updateDoc(doc(db, "projects", pid, "members", uid), fields);

/* ------------------------------------------------------------------ tasks */

interface TaskDoc {
  title: string;
  desc: string;
  status: Status;
  owner: string;
  due: string;
  subtasks: Subtask[];
  createdAt: string;
  createdBy: string;
  deleted: boolean;
}

export type LiveTask = Omit<Task, "comments"> & { createdAt: string };

export const subscribeTasks = (pid: string, cb: (t: LiveTask[]) => void) =>
  onSnapshot(collection(db, "projects", pid, "tasks"), (snap) =>
    cb(
      snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as TaskDoc) }))
        .filter((t) => !t.deleted)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ deleted: _d, createdBy: _c, ...t }) => t),
    ),
  );

const taskRef = (pid: string, id: string) => doc(db, "projects", pid, "tasks", id);

export async function createTask(pid: string, uid: string, t: { id: string; title: string; desc: string; owner: string; due: string; subtasks: Subtask[] }) {
  const { id, ...rest } = t;
  const data: TaskDoc = { ...rest, status: "todo", createdAt: now(), createdBy: uid, deleted: false };
  await setDoc(taskRef(pid, id), data);
}

/** Only the listed fields change; everything else on the task is left alone. */
export const updateTask = (pid: string, id: string, fields: Partial<Pick<TaskDoc, "status" | "owner" | "due" | "subtasks" | "deleted">>) =>
  updateDoc(taskRef(pid, id), fields);

/** Toggles one sub-task inside a transaction so two people ticking boxes at once don't overwrite each other. */
export const toggleSubtask = (pid: string, id: string, sid: string) =>
  runTransaction(db, async (tx) => {
    const snap = await tx.get(taskRef(pid, id));
    if (!snap.exists()) return;
    const subtasks = (snap.data() as TaskDoc).subtasks.map((s) => (s.id === sid ? { ...s, done: !s.done } : s));
    tx.update(taskRef(pid, id), { subtasks });
  });

/* --------------------------------------------------------------- comments */

export type LiveComment = Comment & { taskId: string };

export const subscribeComments = (pid: string, cb: (c: LiveComment[]) => void) =>
  onSnapshot(query(collection(db, "projects", pid, "comments"), orderBy("at")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveComment, "id">) }))),
  );

export async function addComment(pid: string, c: LiveComment) {
  const { id, replyTo, ...rest } = c;
  await setDoc(doc(db, "projects", pid, "comments", id), replyTo ? { ...rest, replyTo } : rest);
}

export const deleteComment = (pid: string, id: string) => deleteDoc(doc(db, "projects", pid, "comments", id));

/* --------------------------------------------------------------- activity */

export const subscribeActivity = (pid: string, cb: (a: Activity[]) => void) =>
  onSnapshot(query(collection(db, "projects", pid, "activity"), orderBy("at", "desc"), limit(50)), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, text: d.data().text as string, at: d.data().at as string }))),
  );

export const logActivity = (pid: string, uid: string, text: string) =>
  setDoc(doc(db, "projects", pid, "activity", newId()), { text, at: now(), by: uid });

/* ---------------------------------------------------------- notifications */

export const subscribeNotifs = (uid: string, pid: string, cb: (n: Notif[]) => void) =>
  onSnapshot(query(collection(db, "users", uid, "notifications"), where("projectId", "==", pid)), (snap) =>
    cb(
      snap.docs
        .map((d) => {
          const x = d.data();
          return { id: d.id, text: x.text, at: x.at, read: x.read, taskId: x.taskId, kind: x.kind } as Notif;
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    ),
  );

/** Sends the same notification to several teammates in one batch. */
export async function notify(pid: string, from: string, to: string[], text: string, kind: NotifKind, taskId?: string) {
  if (!to.length) return;
  const batch = writeBatch(db);
  for (const uid of to) {
    const data: Record<string, unknown> = { projectId: pid, from, text, kind, at: now(), read: false };
    if (taskId) data.taskId = taskId;
    batch.set(doc(db, "users", uid, "notifications", newId()), data);
  }
  await batch.commit();
}

export const markNotifRead = (uid: string, id: string) => updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
export const dismissNotif = (uid: string, id: string) => deleteDoc(doc(db, "users", uid, "notifications", id));
