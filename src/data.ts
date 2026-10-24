export type Status = "todo" | "progress" | "stuck" | "done";
export const STATUSES: Status[] = ["todo", "progress", "stuck", "done"];

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  online: boolean;
}
export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}
export interface Comment {
  id: string;
  author: string; // member id or "system"
  text: string;
  at: string;
  replyTo?: string;
}
export interface Task {
  id: string;
  title: string;
  desc: string;
  status: Status;
  owner: string;
  due: string;
  subtasks: Subtask[];
  comments: Comment[];
}
export interface Milestone {
  id: string;
  title: string;
  due: string;
  taskIds: string[];
}
export interface Activity {
  id: string;
  text: string;
  at: string;
}
export interface Notif {
  id: string;
  text: string;
  at: string;
  read: boolean;
  taskId?: string;
  kind?: NotifKind;
}
export type NotifKind = "stuck" | "comment" | "assign" | "reminder";

export interface Prefs {
  scale: number;
  contrast: boolean;
  calm: boolean;
  spacious: boolean;
  remind: boolean;
  stuckAlerts: boolean;
  comments: boolean;
}
export const DEFAULT_PREFS: Prefs = { scale: 1, contrast: false, calm: false, spacious: false, remind: true, stuckAlerts: true, comments: true };

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
}

/** Avatar colours, all with at least 4.5:1 contrast against white initials. */
export const MEMBER_COLORS = ["#2f6fb5", "#2e7d4f", "#8a5a9e", "#b25e3a", "#3b7f8c", "#9c4668", "#5a6b2f", "#4f5bb0"];

/** Shown when a task or comment references someone who has left the project. */
export const unknownMember = (id: string): Member => ({
  id,
  name: id === "system" ? "Task Mate" : "Former member",
  role: "",
  color: "#6b7580",
  online: false,
});

export const ME = "m1";

export const MEMBERS: Member[] = [
  { id: "m1", name: "Alex Rivera", role: "Project coordinator", color: "#2f6fb5", online: true },
  { id: "m2", name: "Sarah Chen", role: "Research lead", color: "#2e7d4f", online: true },
  { id: "m3", name: "Priya Nair", role: "Data analyst", color: "#8a5a9e", online: false },
  { id: "m4", name: "Jordan Ellis", role: "Survey designer", color: "#b25e3a", online: true },
  { id: "m5", name: "Maya Okafor", role: "Writer and editor", color: "#3b7f8c", online: false },
];

export const iso = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const today = () => iso(0);
export const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const daysUntil = (due: string) => {
  const a = new Date(due + "T00:00");
  const b = new Date(today() + "T00:00");
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};
export const fmtDate = (due: string) =>
  new Date(due + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const fmtTime = (at: string) =>
  new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const dueLabel = (due: string, done = false) => {
  const n = daysUntil(due);
  if (done) return `Was due ${fmtDate(due)}`;
  if (n < 0) return `Past due by ${-n} day${n === -1 ? "" : "s"}`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  return `Due in ${n} days`;
};

const st = (id: string, title: string, done = false): Subtask => ({ id, title, done });
const cm = (id: string, author: string, text: string, min: number, replyTo?: string): Comment => ({
  id,
  author,
  text,
  at: ago(min),
  replyTo,
});

export const SEED_TASKS: Task[] = [
  {
    id: "t1",
    title: "Literature Review",
    desc: "Summarise ten peer-reviewed sources on carbon pricing and group them by theme.",
    status: "progress",
    owner: "m2",
    due: iso(2),
    subtasks: [st("a", "Find ten sources", true), st("b", "Write theme summaries", true), st("c", "Link to research question"), st("d", "Peer check")],
    comments: [
      cm("c1", "system", "Task created by Alex Rivera.", 4300),
      cm("c2", "m2", "Seven sources are in the shared folder. I will add the rest tonight.", 380),
      cm("c3", "m1", "Great. Do you want a second pair of eyes on the theme grouping?", 340, "c2"),
      cm("c4", "system", "Task status changed to In Progress by Sarah Chen.", 300),
    ],
  },
  {
    id: "t2",
    title: "Methodology",
    desc: "Describe the mixed-methods approach, sampling, and ethical considerations.",
    status: "done",
    owner: "m3",
    due: iso(-1),
    subtasks: [st("a", "Sampling plan", true), st("b", "Ethics paragraph", true)],
    comments: [cm("c1", "system", "Task status changed to Completed by Priya Nair.", 1500)],
  },
  {
    id: "t3",
    title: "Research question",
    desc: "Agree and word the main research question and two sub-questions.",
    status: "done",
    owner: "m1",
    due: iso(-3),
    subtasks: [],
    comments: [cm("c1", "system", "Task status changed to Completed by Alex Rivera.", 5000)],
  },
  {
    id: "t4",
    title: "Survey design",
    desc: "Draft the 12-question survey and test it with two classmates.",
    status: "stuck",
    owner: "m4",
    due: iso(3),
    subtasks: [st("a", "Draft questions", true), st("b", "Pilot with two classmates"), st("c", "Revise wording")],
    comments: [
      cm("c1", "system", "Task status changed to Stuck by Jordan Ellis. The team has been notified.", 200),
      cm("c2", "m4", "I am unsure how to word the questions about income without sounding intrusive. Any ideas?", 195),
      cm("c3", "m3", "I have used banded ranges before. Happy to share my template.", 120, "c2"),
    ],
  },
  {
    id: "t5",
    title: "Data collection",
    desc: "Send the survey, track responses, and close it once we reach 40 responses.",
    status: "todo",
    owner: "m5",
    due: iso(7),
    subtasks: [st("a", "Publish survey link"), st("b", "Track responses")],
    comments: [],
  },
  {
    id: "t6",
    title: "Data analysis",
    desc: "Clean the dataset, run descriptive statistics, and produce three charts.",
    status: "todo",
    owner: "m3",
    due: iso(10),
    subtasks: [],
    comments: [],
  },
  {
    id: "t7",
    title: "Draft introduction",
    desc: "Write 400 words framing the problem and stating our research question.",
    status: "progress",
    owner: "m1",
    due: iso(5),
    subtasks: [st("a", "Outline", true), st("b", "First draft"), st("c", "Edit for tone")],
    comments: [],
  },
  {
    id: "t8",
    title: "Reference list",
    desc: "Format all citations in the Harvard style and check for missing entries.",
    status: "todo",
    owner: "m5",
    due: iso(12),
    subtasks: [],
    comments: [],
  },
  {
    id: "t9",
    title: "Slide deck",
    desc: "Build a ten-slide presentation from the final report.",
    status: "todo",
    owner: "m2",
    due: iso(15),
    subtasks: [],
    comments: [],
  },
  {
    id: "t10",
    title: "Final proofread",
    desc: "Read the whole submission aloud once and fix any inconsistencies.",
    status: "todo",
    owner: "m4",
    due: iso(17),
    subtasks: [],
    comments: [],
  },
];

export const MILESTONES: Milestone[] = [
  { id: "ms1", title: "Research foundation", due: iso(3), taskIds: ["t1", "t2", "t3"] },
  { id: "ms2", title: "Data ready", due: iso(10), taskIds: ["t4", "t5", "t6"] },
  { id: "ms3", title: "Draft complete", due: iso(12), taskIds: ["t7", "t8"] },
  { id: "ms4", title: "Submission", due: iso(17), taskIds: ["t9", "t10"] },
];

export const SEED_ACTIVITY: Activity[] = [
  { id: "x1", text: "Priya Nair marked 'Methodology' as Completed", at: ago(1500) },
  { id: "x2", text: "Jordan Ellis marked 'Survey design' as Stuck", at: ago(200) },
  { id: "x3", text: "Priya Nair replied on 'Survey design'", at: ago(120) },
  { id: "x4", text: "Sarah Chen added 3 sources to 'Literature Review'", at: ago(90) },
  { id: "x5", text: "Alex Rivera started 'Draft introduction'", at: ago(45) },
];

export const SEED_NOTIFS: Notif[] = [
  { id: "n1", text: "Reminder: Task 'Literature Review' is due in 2 days.", at: ago(30), read: false, taskId: "t1" },
  { id: "n2", text: "'Survey design' is marked Stuck. Teammates are invited to offer help.", at: ago(200), read: false, taskId: "t4" },
  { id: "n3", text: "New reply on 'Survey design'.", at: ago(120), read: true, taskId: "t4" },
  { id: "n4", text: "'Draft introduction' was assigned to you.", at: ago(2900), read: true, taskId: "t7" },
];

export const taskProgress = (t: Task) => {
  if (t.status === "done") return 100;
  if (t.subtasks.length) return Math.round((t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100);
  return t.status === "progress" ? 40 : t.status === "stuck" ? 20 : 0;
};
