import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PREFS, ME, MEMBERS, MILESTONES, SEED_ACTIVITY, SEED_NOTIFS, SEED_TASKS, STATUSES,
  daysUntil, fmtDate, unknownMember,
  type Activity, type Comment, type Member, type Milestone, type Notif, type Prefs, type Project, type Status, type Task,
} from "./data";
import { STATUS } from "./ui";
import { useAuth } from "./auth";
import * as remote from "./remote";

export type View = "login" | "projects" | "dashboard" | "tasks" | "team" | "settings";
export type { Prefs };
export interface Toast {
  id: number;
  msg: string;
  tone: "success" | "info" | "support";
  /** Reverts the action that produced this toast. */
  undo?: () => void;
}
export interface Filters {
  status: Status | "all";
  member: string;
  deadline: "all" | "overdue" | "week" | "later";
}

export const NO_FILTERS: Filters = { status: "all", member: "all", deadline: "all" };

let uid = 100;
const nid = () => String(++uid);
const now = () => new Date().toISOString();
const PROJECT_KEY = "taskmate.project";

/** Reads ?join=CODE from an invite link once, then tidies the URL. */
function readJoinCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");
  if (code) {
    params.delete("join");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
  }
  return code ?? "";
}

function useStoreValue() {
  const { user, signOut: authSignOut } = useAuth();

  /* ---------- session ---------- */
  const [demo, setDemo] = useState(false);
  const live = !!user && !demo;
  const [view, setView] = useState<View>("login");
  const [pendingJoin, setPendingJoin] = useState(readJoinCode);
  const [projectId, setProjectId] = useState<string | null>(() => localStorage.getItem(PROJECT_KEY));
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<remote.UserProfile | null>(null);

  /* ---------- demo data (local only) ---------- */
  const [demoTasks, setDemoTasks] = useState<Task[]>(SEED_TASKS);
  const [demoActivity, setDemoActivity] = useState<Activity[]>(SEED_ACTIVITY);
  const [demoNotifs, setDemoNotifs] = useState<Notif[]>(SEED_NOTIFS);

  /* ---------- live data (Firestore) ---------- */
  const [liveTasks, setLiveTasks] = useState<remote.LiveTask[]>([]);
  const [liveComments, setLiveComments] = useState<remote.LiveComment[]>([]);
  const [liveActivity, setLiveActivity] = useState<Activity[]>([]);
  const [liveNotifs, setLiveNotifs] = useState<Notif[]>([]);
  const [liveMembers, setLiveMembers] = useState<Member[]>([]);

  /* ---------- UI state ---------- */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  // Apply accessibility preferences to the whole document.
  useEffect(() => {
    const r = document.documentElement;
    r.style.fontSize = `${16 * prefs.scale}px`;
    r.classList.toggle("hc", prefs.contrast);
    r.classList.toggle("rm", prefs.calm);
    r.classList.toggle("spacious", prefs.spacious);
  }, [prefs]);

  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(null), 2800);
    return () => clearTimeout(t);
  }, [celebrate]);

  // Signed in: load the private profile. Signed out: back to the login screen.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      if (!demo) setView("login");
      return;
    }
    setDemo(false);
    const fallbackName = user.displayName || user.email?.split("@")[0] || "Teammate";
    remote.ensureUserProfile(user.uid, fallbackName, user.email ?? "").catch(console.error);
    return remote.subscribeProfile(user.uid, (p) => {
      setProfile(p);
      if (p?.prefs) setPrefs({ ...DEFAULT_PREFS, ...p.prefs });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Once the profile is known, open the last project (if still a member) or the picker.
  useEffect(() => {
    if (!live || !profile) return;
    const valid = projectId && profile.projectIds.includes(projectId);
    if (!valid || pendingJoin) {
      if (!valid) setProjectId(null);
      setView((v) => (v === "login" || !valid ? "projects" : v));
    } else {
      setView((v) => (v === "login" || v === "projects" ? "dashboard" : v));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, profile]);

  // Live listeners for the selected project.
  useEffect(() => {
    if (!live || !projectId || !user) return;
    const pid = projectId;
    const unsubs = [
      remote.subscribeProject(
        pid,
        (p) => setProject(p),
        () => {
          // Permission denied: the user was removed or the project is gone.
          leaveToPicker();
          toast("You no longer have access to that project.", "info");
        },
      ),
      remote.subscribeMembers(pid, setLiveMembers),
      remote.subscribeTasks(pid, setLiveTasks),
      remote.subscribeComments(pid, setLiveComments),
      remote.subscribeActivity(pid, setLiveActivity),
      remote.subscribeNotifs(user.uid, pid, setLiveNotifs),
    ];
    // Presence: "online" means active in the last few minutes.
    remote.heartbeat(pid, user.uid);
    const beat = setInterval(() => document.visibilityState === "visible" && remote.heartbeat(pid, user.uid), 2 * 60 * 1000);
    return () => {
      unsubs.forEach((u) => u());
      clearInterval(beat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, projectId, user]);

  /* ---------- derived ---------- */
  const members = live ? liveMembers : MEMBERS;
  const me = live ? user!.uid : ME;
  const memberOf = (id: string): Member => members.find((m) => m.id === id) ?? unknownMember(id);
  const userName = live ? (members.find((m) => m.id === me)?.name ?? profile?.name ?? "You") : "Alex Rivera";
  const first = userName.split(" ")[0];
  const milestones: Milestone[] = live ? [] : MILESTONES;
  const projectName = live ? (project?.name ?? "") : "Climate Policy Report";
  const isOwner = live && project?.ownerId === me;
  const projectLoading = live && !!projectId && !project;

  const tasks = useMemo<Task[]>(() => {
    if (!live) return demoTasks;
    const byTask = new Map<string, Comment[]>();
    for (const { taskId, ...c } of liveComments) {
      if (!byTask.has(taskId)) byTask.set(taskId, []);
      byTask.get(taskId)!.push(c);
    }
    return liveTasks.map(({ createdAt: _c, ...t }) => ({ ...t, comments: byTask.get(t.id) ?? [] }));
  }, [live, demoTasks, liveTasks, liveComments]);

  const activity = live ? liveActivity : demoActivity;
  const notifs = live
    ? liveNotifs.filter((n) => !(n.kind === "stuck" && !prefs.stuckAlerts) && !(n.kind === "comment" && !prefs.comments))
    : demoNotifs;

  /* ---------- helpers ---------- */
  const toast = (msg: string, tone: Toast["tone"] = "success", undo?: () => void) =>
    setToasts((t) => [...t, { id: Date.now() + Math.random(), msg, tone, undo }].slice(-3));
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const fail = (e: unknown) => {
    console.error(e);
    toast("That change couldn't be saved. Check your connection and try again.", "info");
  };
  const pid = projectId ?? "";
  const others = (exclude: string[] = []) => members.map((m) => m.id).filter((id) => id !== me && !exclude.includes(id));

  const log = (text: string) =>
    live
      ? remote.logActivity(pid, me, text).catch(console.error)
      : setDemoActivity((a) => [{ id: nid(), text, at: now() }, ...a]);
  const sys = (taskId: string, text: string) =>
    live
      ? remote.addComment(pid, { id: remote.newId(), taskId, author: "system", text, at: now() }).catch(console.error)
      : setDemoTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, { id: nid(), author: "system", text, at: now() }] } : t)));
  const demoNotify = (text: string, taskId?: string) =>
    setDemoNotifs((n) => [{ id: nid(), text, at: now(), read: false, taskId }, ...n]);
  const patchDemo = (id: string, fn: (t: Task) => Task) => setDemoTasks((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  const restoreDemo = (prev: Task[]) => () => setDemoTasks(prev);
  const undone = () => toast("Action undone.", "info");

  /* ---------- session actions ---------- */
  function leaveToPicker() {
    localStorage.removeItem(PROJECT_KEY);
    setProjectId(null);
    setProject(null);
    setLiveTasks([]); setLiveComments([]); setLiveActivity([]); setLiveNotifs([]); setLiveMembers([]);
    setOpenTask(null); setFilters(NO_FILTERS);
    setView("projects");
  }
  const selectProject = (id: string) => {
    if (id !== projectId) leaveToPicker();
    localStorage.setItem(PROJECT_KEY, id);
    setProjectId(id);
    setPendingJoin("");
    setView("dashboard");
  };
  const enterDemo = () => {
    setDemoTasks(SEED_TASKS); setDemoActivity(SEED_ACTIVITY); setDemoNotifs(SEED_NOTIFS);
    setDemo(true);
    setView("dashboard");
  };
  const signOut = async () => {
    setOpenTask(null); setCreateOpen(false); setNotifOpen(false); setToasts([]);
    if (demo) {
      setDemo(false);
      setView(user ? "projects" : "login");
      return;
    }
    leaveToPicker();
    await authSignOut();
    setPrefs(DEFAULT_PREFS);
    setView("login");
  };

  /* ---------- task actions ---------- */
  const setStatus = (id: string, status: Status) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const subtasks = status === "done" ? t.subtasks.map((s) => ({ ...s, done: true })) : t.subtasks;
    let undo: () => void;
    if (live) {
      remote.updateTask(pid, id, { status, subtasks }).catch(fail);
      undo = () => remote.updateTask(pid, id, { status: t.status, subtasks: t.subtasks }).then(undone, fail);
    } else {
      undo = restoreDemo(demoTasks);
      patchDemo(id, (x) => ({ ...x, status, subtasks }));
    }
    sys(id, `Task status changed to ${STATUS[status].label} by ${userName}.${status === "stuck" ? " The team has been notified." : ""}`);
    log(`${first} marked '${t.title}' as ${STATUS[status].label}`);
    if (status === "stuck") {
      const text = `'${t.title}' is marked Stuck. Teammates are invited to offer help.`;
      if (live) remote.notify(pid, me, others(), text, "stuck", id).catch(console.error);
      else demoNotify(text, id);
      toast("Your team has been notified. Someone will help soon.", "support", undo);
    } else if (status === "done") {
      setCelebrate(t.title);
      const ms = milestones.find((m) => m.taskIds.includes(id));
      const reached = ms && ms.taskIds.every((tid) => tid === id || tasks.find((x) => x.id === tid)?.status === "done");
      toast(reached ? `Milestone reached: ${ms!.title}. Well done, team!` : `'${t.title}' completed. Nice work.`, "success", undo);
    } else toast(`Status changed to ${STATUS[status].label}.`, "success", undo);
  };

  const toggleSubtask = (taskId: string, sid: string) => {
    if (live) remote.toggleSubtask(pid, taskId, sid).catch(fail);
    else patchDemo(taskId, (t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === sid ? { ...s, done: !s.done } : s)) }));
  };

  const addTask = (d: { title: string; desc: string; owner: string; due: string; subtasks: string[] }) => {
    const id = live ? remote.newId() : nid();
    const subtasks = d.subtasks.map((s) => ({ id: live ? remote.newId() : nid(), title: s, done: false }));
    let undo: () => void;
    if (live) {
      remote.createTask(pid, me, { id, title: d.title, desc: d.desc, owner: d.owner, due: d.due, subtasks }).catch(fail);
      undo = () => remote.updateTask(pid, id, { deleted: true }).then(undone, fail);
      if (d.owner !== me) remote.notify(pid, me, [d.owner], `${userName} assigned you '${d.title}'.`, "assign", id).catch(console.error);
    } else {
      undo = restoreDemo(demoTasks);
      setDemoTasks((ts) => [{ id, title: d.title, desc: d.desc, status: "todo", owner: d.owner, due: d.due, subtasks, comments: [] }, ...ts]);
      demoNotify(`'${d.title}' was assigned to ${memberOf(d.owner).name}.`, id);
    }
    sys(id, `Task created by ${userName}.`);
    log(`${first} created '${d.title}'`);
    toast("Task saved successfully.", "success", undo);
  };

  const addComment = (taskId: string, text: string, replyTo?: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (live) {
      remote.addComment(pid, { id: remote.newId(), taskId, author: me, text, at: now(), replyTo }).catch(fail);
      if (t) {
        const parent = replyTo ? t.comments.find((c) => c.id === replyTo)?.author : undefined;
        const to = [...new Set([t.owner, parent].filter((x): x is string => !!x && x !== me && x !== "system"))];
        remote.notify(pid, me, to, `${first} ${replyTo ? "replied" : "commented"} on '${t.title}'.`, "comment", taskId).catch(console.error);
      }
    } else {
      patchDemo(taskId, (x) => ({ ...x, comments: [...x.comments, { id: nid(), author: me, text, at: now(), replyTo }] }));
    }
    if (t) log(`${first} ${replyTo ? "replied" : "commented"} on '${t.title}'`);
    toast("Comment posted.");
  };

  const deleteComment = (taskId: string, cid: string) => {
    let undo: () => void;
    if (live) {
      const c = liveComments.find((x) => x.id === cid);
      if (!c) return;
      remote.deleteComment(pid, cid).catch(fail);
      undo = () => remote.addComment(pid, c).then(undone, fail);
    } else {
      undo = restoreDemo(demoTasks);
      patchDemo(taskId, (t) => ({ ...t, comments: t.comments.filter((c) => c.id !== cid) }));
    }
    toast("Comment deleted.", "info", undo);
  };

  const deleteTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    let undo: () => void;
    if (live) {
      // Soft delete so Undo can bring the task (and its comments) back.
      remote.updateTask(pid, id, { deleted: true }).catch(fail);
      undo = () => remote.updateTask(pid, id, { deleted: false }).then(undone, fail);
    } else {
      undo = restoreDemo(demoTasks);
      setDemoTasks((ts) => ts.filter((x) => x.id !== id));
    }
    setOpenTask(null);
    if (t) log(`${first} deleted '${t.title}'`);
    toast(`'${t?.title}' deleted.`, "info", undo);
  };

  const assign = (id: string, owner: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.owner === owner) return;
    const name = memberOf(owner).name;
    let undo: () => void;
    if (live) {
      remote.updateTask(pid, id, { owner }).catch(fail);
      undo = () => remote.updateTask(pid, id, { owner: t.owner }).then(undone, fail);
      if (owner !== me) remote.notify(pid, me, [owner], `${userName} assigned you '${t.title}'.`, "assign", id).catch(console.error);
    } else {
      undo = restoreDemo(demoTasks);
      patchDemo(id, (x) => ({ ...x, owner }));
      demoNotify(`'${t.title}' was assigned to ${name}.`, id);
    }
    sys(id, `Task assigned to ${name} by ${userName}.`);
    log(`${first} assigned '${t.title}' to ${name.split(" ")[0]}`);
    toast(`Assigned to ${name}.`, "success", undo);
  };

  const setDue = (id: string, due: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    let undo: () => void;
    if (live) {
      remote.updateTask(pid, id, { due }).catch(fail);
      undo = () => remote.updateTask(pid, id, { due: t.due }).then(undone, fail);
    } else {
      undo = restoreDemo(demoTasks);
      patchDemo(id, (x) => ({ ...x, due }));
    }
    sys(id, `Deadline set to ${fmtDate(due)} by ${userName}.`);
    toast(`Deadline set to ${fmtDate(due)}.`, "success", undo);
  };

  const sendReminder = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    if (live && t.owner !== me) {
      remote.notify(pid, me, [t.owner], `Friendly reminder from ${first}: '${t.title}' is due ${fmtDate(t.due)}.`, "reminder", id).catch(console.error);
    }
    sys(id, `A reminder was sent to ${memberOf(t.owner).name}.`);
    toast(`Reminder sent for '${t.title}'.`);
  };

  const undo = (toastId: number) => {
    const t = toasts.find((x) => x.id === toastId);
    if (t?.undo) {
      t.undo();
      if (!live) undone();
    }
    dismissToast(toastId);
  };

  /* ---------- notifications & prefs ---------- */
  const markRead = (id: string) => {
    if (live) remote.markNotifRead(me, id).catch(console.error);
    else setDemoNotifs((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  };
  const markAllRead = () => {
    if (live) notifs.filter((n) => !n.read).forEach((n) => remote.markNotifRead(me, n.id).catch(console.error));
    else setDemoNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };
  const dismissNotif = (id: string) => {
    if (live) remote.dismissNotif(me, id).catch(console.error);
    else setDemoNotifs((n) => n.filter((x) => x.id !== id));
  };
  const savePrefs = (p: Prefs) => {
    setPrefs(p);
    if (live) remote.savePrefs(me, p).then(() => toast("Changes saved."), fail);
    else toast("Changes saved.");
  };

  /* ---------- filters ---------- */
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (filters.status !== "all" && t.status !== filters.status) return false;
        if (filters.member !== "all" && t.owner !== filters.member) return false;
        const n = daysUntil(t.due);
        if (filters.deadline === "overdue" && !(n < 0 && t.status !== "done")) return false;
        if (filters.deadline === "week" && !(n >= 0 && n <= 7)) return false;
        if (filters.deadline === "later" && !(n > 7)) return false;
        return true;
      }),
    [tasks, filters],
  );

  const percent = tasks.length ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0;

  return {
    // session
    live, demo, view, setView, user, profile, project, projectId, projectName, projectLoading, isOwner,
    pendingJoin, setPendingJoin, selectProject, leaveToPicker, enterDemo, signOut,
    // people
    members, me, memberOf, userName,
    // data
    tasks, filtered, activity, notifs, milestones, percent,
    // ui
    toasts, prefs, filters, setFilters, openTask, setOpenTask, createOpen, setCreateOpen, notifOpen, setNotifOpen, celebrate,
    // actions
    toast, dismissToast, setStatus, toggleSubtask, addTask, addComment, deleteComment, deleteTask, assign,
    setDue, sendReminder, undo, markRead, markAllRead, dismissNotif, savePrefs,
  };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
};
export const useStore = () => useContext(Ctx)!;
export { STATUSES };
