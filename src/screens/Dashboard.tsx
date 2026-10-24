import { useState, type DragEvent } from "react";
import { AlertTriangle, CalendarDays, Flag, GripVertical, MessageSquare, Plus, Check, Activity as ActIcon } from "lucide-react";
import { STATUSES, daysUntil, dueLabel, fmtDate, fmtTime, taskProgress, type Status, type Task } from "../data";
import { NO_FILTERS, useStore } from "../store";
import { Avatar, ProgressBar, STATUS, StatusBadge, Tooltip } from "../ui";

export function Filters() {
  const { filters, setFilters, filtered, tasks, members } = useStore();
  const active = filters.status !== "all" || filters.member !== "all" || filters.deadline !== "all";
  const sel = "field !min-h-10 !py-1.5 !w-auto";
  return (
    <section aria-label="Filter tasks" className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="f-status" className="mb-1 block text-xs font-bold uppercase tracking-wide text-mute">Status</label>
        <select id="f-status" className={sel} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as Status | "all" })}>
          <option value="all">All statuses</option>
          {STATUSES.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-member" className="mb-1 block text-xs font-bold uppercase tracking-wide text-mute">Team member</label>
        <select id="f-member" className={sel} value={filters.member} onChange={(e) => setFilters({ ...filters, member: e.target.value })}>
          <option value="all">Everyone</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-dl" className="mb-1 block text-xs font-bold uppercase tracking-wide text-mute">Deadline</label>
        <select id="f-dl" className={sel} value={filters.deadline} onChange={(e) => setFilters({ ...filters, deadline: e.target.value as typeof filters.deadline })}>
          <option value="all">Any time</option>
          <option value="overdue">Past due</option>
          <option value="week">Next 7 days</option>
          <option value="later">Later</option>
        </select>
      </div>
      <p role="status" className="pb-2 text-sm font-semibold text-mute">
        Showing {filtered.length} of {tasks.length} tasks{active && " (filtered)"}
      </p>
      {active && <button type="button" className="btn btn-sm mb-0.5" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>}
    </section>
  );
}

function TaskCard({ t }: { t: Task }) {
  const s = useStore();
  const owner = s.memberOf(t.owner);
  const pct = taskProgress(t);
  const n = daysUntil(t.due);
  const urgent = t.status !== "done" && n <= 2;
  const stuck = t.status === "stuck";
  return (
    <article
      aria-label={`${t.title}, ${STATUS[t.status].label}`}
      draggable
      onDragStart={(e: DragEvent) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
      className={`card group cursor-grab p-4 transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${stuck ? "animate-pulse-ring !border-[#f0ad4e] !bg-[#fffaf0]" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <span className="-ml-1.5 mt-0.5 text-[#6b7580]" aria-hidden="true" title="Drag to move"><GripVertical size={18} /></span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => s.setOpenTask(t.id)} className="text-left text-base font-bold leading-snug hover:text-brand hover:underline">
            {t.title}
          </button>
          <p className="mt-1 line-clamp-2 text-sm text-mute">{t.desc}</p>
        </div>
      </div>

      {stuck && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#fdf0d8] px-2.5 py-1.5 text-xs font-bold text-[#6b3e00]">
          <AlertTriangle size={14} aria-hidden="true" /> Could use a hand. Offer help?
        </p>
      )}

      <div className="mt-3"><ProgressBar value={pct} color={STATUS[t.status].color} label={`${t.title} progress`} h={8} /></div>

      {t.subtasks.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {t.subtasks.slice(0, 3).map((st) => (
            <li key={st.id}>
              <label className="flex min-h-8 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-[#2f6fb5]" checked={st.done} onChange={() => s.toggleSubtask(t.id, st.id)} />
                <span className={st.done ? "text-mute line-through" : ""}>{st.title}</span>
              </label>
            </li>
          ))}
          {t.subtasks.length > 3 && <li className="pl-6 text-xs text-mute">+{t.subtasks.length - 3} more</li>}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Avatar m={owner} size={26} />
          <span className="truncate">{owner.name.split(" ")[0]}</span>
        </span>
        <span className={`flex items-center gap-1 whitespace-nowrap text-xs font-bold ${urgent ? "text-[#a35a00]" : "text-mute"}`}>
          <CalendarDays size={14} aria-hidden="true" /> {t.status === "done" ? fmtDate(t.due) : dueLabel(t.due)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <StatusBadge status={t.status} />
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-mute" aria-label={`${t.comments.filter((c) => c.author !== "system").length} comments`}>
            <MessageSquare size={14} aria-hidden="true" />{t.comments.filter((c) => c.author !== "system").length}
          </span>
          <label className="sr-only" htmlFor={`mv-${t.id}`}>Move {t.title} to</label>
          <select id={`mv-${t.id}`} className="rounded-md border border-[#8e99a5] bg-white px-1.5 py-1 text-xs font-semibold" value="" onChange={(e) => s.setStatus(t.id, e.target.value as Status)}>
            <option value="" disabled>Move to…</option>
            {STATUSES.filter((k) => k !== t.status).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </span>
      </div>
    </article>
  );
}

export function Board() {
  const s = useStore();
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUSES.map((k) => {
        const m = STATUS[k];
        const Icon = m.icon;
        const list = s.filtered.filter((t) => t.status === k);
        return (
          <section
            key={k}
            aria-labelledby={`col-${k}`}
            onDragOver={(e) => { e.preventDefault(); setOver(k); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) s.setStatus(id, k); }}
            className={`rounded-2xl border-2 p-3 transition ${over === k ? "border-dashed border-brand bg-brand-tint" : "border-transparent bg-[#ebeef1]"}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <Tooltip text={m.help}>
                <h3 id={`col-${k}`} tabIndex={0} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${m.chip}`}>
                  <Icon size={15} aria-hidden="true" /> {m.label}
                </h3>
              </Tooltip>
              <span className="text-sm font-bold text-mute" aria-label={`${list.length} tasks`}>{list.length}</span>
            </header>
            <div className="space-y-3">
              {list.map((t) => <TaskCard key={t.id} t={t} />)}
              {list.length === 0 && <p className="rounded-xl border border-dashed border-[#aab3bc] p-4 text-center text-sm text-mute">No tasks here. Drop a card to move it.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Milestones() {
  const { tasks, milestones } = useStore();
  if (milestones.length === 0) return null;
  return (
    <section aria-labelledby="ms-h" className="card p-6">
      <h2 id="ms-h" className="mb-5 flex items-center gap-2 font-extrabold"><Flag size={18} aria-hidden="true" /> Milestones</h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map((m, i) => {
          const ts = tasks.filter((t) => m.taskIds.includes(t.id));
          const done = ts.filter((t) => t.status === "done").length;
          const reached = ts.length > 0 && done === ts.length;
          const d = daysUntil(m.due);
          return (
            <li key={m.id} className="relative">
              <div className="mb-2 flex items-center gap-2">
                <span className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold ${reached ? "border-[#2f7a33] bg-[#2f7a33] text-white" : "border-brand bg-white text-brand"}`}>
                  {reached ? <Check size={16} aria-hidden="true" className="animate-pop" /> : i + 1}
                </span>
                <span className="h-0.5 flex-1 bg-line" aria-hidden="true" />
              </div>
              <h3 className="font-bold leading-tight">{m.title}</h3>
              <p className="text-sm text-mute">{reached ? "Reached" : `${fmtDate(m.due)} · ${d < 0 ? "past due" : d === 0 ? "today" : `${d}d`}`}</p>
              <div className="mt-2"><ProgressBar value={ts.length ? Math.round((done / ts.length) * 100) : 0} label={`${m.title} progress`} h={6} /></div>
              <p className="mt-1 text-xs font-semibold text-mute">{done} of {ts.length} tasks complete</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Dashboard() {
  const s = useStore();
  const [all, setAll] = useState(false);
  const stuck = s.tasks.filter((t) => t.status === "stuck");
  const counts = STATUSES.map((k) => [k, s.tasks.filter((t) => t.status === k).length] as const);
  const upcoming = [...s.tasks].filter((t) => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const feed = all ? s.activity : s.activity.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Dashboard</p>
          <h1 className="text-4xl font-extrabold tracking-tight">{s.projectName}</h1>
          <p className="mt-1 text-mute">One shared view of what is happening, who owns it, and when it is due.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => s.setCreateOpen(true)}><Plus size={18} aria-hidden="true" /> Add Task</button>
      </div>

      <section aria-labelledby="ov-h" className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="ov-h" className="font-bold text-mute">Overall project progress</h2>
            <p className="text-6xl font-extrabold tracking-tight" style={{ color: s.percent >= 100 ? "#2f7a33" : "#2f6fb5" }}>{s.percent}%</p>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Task counts by status">
            {counts.map(([k, c]) => (
              <li key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${STATUS[k].chip}`}>
                {(() => { const I = STATUS[k].icon; return <I size={15} aria-hidden="true" />; })()} {STATUS[k].label}
                <span className="rounded-md bg-white/70 px-1.5">{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5"><ProgressBar value={s.percent} label="Overall project completion" h={18} /></div>
        <p className="mt-3 text-sm text-mute">
          {s.percent >= 100 ? "Every task is complete. Wonderful teamwork." : "Every completed task moves the whole team forward."}
        </p>
      </section>

      {stuck.length > 0 && (
        <section role="region" aria-label="Tasks that could use help" className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-[#f0ad4e] bg-[#fff6e5] p-5">
          <AlertTriangle className="text-[#a35a00]" aria-hidden="true" />
          <p className="min-w-0 flex-1 font-semibold text-[#5e3600]">
            {stuck.length} task{stuck.length > 1 ? "s" : ""} could use a hand: {stuck.map((t) => t.title).join(", ")}. A quick comment can unblock a teammate.
          </p>
          <button type="button" className="btn btn-sm" onClick={() => s.setOpenTask(stuck[0].id)}>Offer help</button>
        </section>
      )}

      <Milestones />

      <section aria-labelledby="bd-h" className="space-y-5">
        <h2 id="bd-h" className="text-2xl font-extrabold">Task board</h2>
        <Filters />
        <p className="text-sm text-mute">Drag cards between columns, or use each card&apos;s &ldquo;Move to&rdquo; menu with the keyboard.</p>
        <Board />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="act-h" className="card p-6">
          <h2 id="act-h" className="mb-4 flex items-center gap-2 font-extrabold"><ActIcon size={18} aria-hidden="true" /> Live activity</h2>
          <ul className="space-y-3">
            {feed.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-soft" aria-hidden="true" />
                <div><p>{a.text}</p><time dateTime={a.at} className="text-xs text-mute">{fmtTime(a.at)}</time></div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-sm mt-4" onClick={() => setAll(!all)} aria-expanded={all}>{all ? "Show less" : "View activity history"}</button>
        </section>

        <section aria-labelledby="up-h" className="card p-6">
          <h2 id="up-h" className="mb-4 flex items-center gap-2 font-extrabold"><CalendarDays size={18} aria-hidden="true" /> Upcoming deadlines</h2>
          <ol className="relative space-y-4 border-l-2 border-line pl-5">
            {upcoming.map((t) => {
              const n = daysUntil(t.due);
              return (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[1.78rem] top-1.5 size-3 rounded-full border-2 border-white" style={{ background: STATUS[t.status].color }} aria-hidden="true" />
                  <button type="button" onClick={() => s.setOpenTask(t.id)} className="text-left font-bold hover:text-brand hover:underline">{t.title}</button>
                  <p className="text-sm text-mute">{fmtDate(t.due)} · {n < 0 ? "past due" : n === 0 ? "today" : `in ${n} day${n > 1 ? "s" : ""}`} · {s.memberOf(t.owner).name}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
