import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { STATUSES, dueLabel, fmtDate, taskProgress, type Status } from "../data";
import { useStore } from "../store";
import { Avatar, ProgressBar, STATUS, StatusBadge } from "../ui";
import { Filters } from "./Dashboard";

export default function Tasks() {
  const s = useStore();
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("auto");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-brand">Tasks</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">All tasks</h1>
          <p className="mt-1 text-sm text-mute">A list view of every task with owner, deadline and status.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle on medium and large screens */}
          <div className="hidden sm:inline-flex rounded-xl bg-canvas p-1 border border-line" role="group" aria-label="View layout">
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${viewMode === "table" || (viewMode === "auto") ? "bg-white text-ink shadow-sm" : "text-mute hover:text-ink"}`}
              onClick={() => setViewMode("table")}
              title="Table view"
              aria-label="Table view"
            >
              <List size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${viewMode === "cards" ? "bg-white text-ink shadow-sm" : "text-mute hover:text-ink"}`}
              onClick={() => setViewMode("cards")}
              title="Cards view"
              aria-label="Cards view"
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => s.setCreateOpen(true)}>
            <Plus size={18} aria-hidden="true" /> <span className="whitespace-nowrap">Add Task</span>
          </button>
        </div>
      </div>

      <Filters />

      {/* Mobile Card View (shown on small screens or when user chooses cards) */}
      <div className={`${viewMode === "table" ? "hidden" : viewMode === "cards" ? "block" : "block md:hidden"} space-y-3`}>
        {s.filtered.map((t) => {
          const o = s.memberOf(t.owner);
          return (
            <article key={t.id} className="card p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="text-left font-bold text-base leading-snug hover:text-brand hover:underline"
                  onClick={() => s.setOpenTask(t.id)}
                >
                  {t.title}
                </button>
                <StatusBadge status={t.status} />
              </div>

              {t.desc && <p className="mt-1.5 text-xs text-mute line-clamp-2">{t.desc}</p>}

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-mute">
                  <span>Progress</span>
                  <span>{taskProgress(t)}%</span>
                </div>
                <ProgressBar value={taskProgress(t)} color={STATUS[t.status].color} label={`${t.title} progress`} h={7} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                <span className="flex items-center gap-2 font-semibold">
                  <Avatar m={o} size={24} />
                  <span>{o.name}</span>
                </span>
                <span className="font-semibold text-mute">
                  {fmtDate(t.due)} ({dueLabel(t.due, t.status === "done")})
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <label htmlFor={`ms-${t.id}`} className="text-xs font-semibold text-mute">Change status:</label>
                <select
                  id={`ms-${t.id}`}
                  className="rounded-lg border border-[#8e99a5] bg-white px-2 py-1 text-xs font-semibold"
                  value={t.status}
                  onChange={(e) => s.setStatus(t.id, e.target.value as Status)}
                >
                  {STATUSES.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                </select>
              </div>
            </article>
          );
        })}
        {s.filtered.length === 0 && (
          <div className="card p-8 text-center text-sm text-mute">No tasks match these filters.</div>
        )}
      </div>

      {/* Desktop / Tablet Table View */}
      <div className={`${viewMode === "cards" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"} card overflow-x-auto`}>
        <table className="w-full min-w-[700px] text-left">
          <caption className="sr-only">Project tasks</caption>
          <thead>
            <tr className="border-b border-line text-sm text-mute">
              <th scope="col" className="p-4 font-bold">Task</th>
              <th scope="col" className="p-4 font-bold">Owner</th>
              <th scope="col" className="p-4 font-bold">Deadline</th>
              <th scope="col" className="p-4 font-bold">Progress</th>
              <th scope="col" className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {s.filtered.map((t) => {
              const o = s.memberOf(t.owner);
              return (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-[#f8fafc]">
                  <th scope="row" className="p-4 font-bold">
                    <button type="button" className="text-left hover:text-brand hover:underline" onClick={() => s.setOpenTask(t.id)}>{t.title}</button>
                  </th>
                  <td className="p-4"><span className="flex items-center gap-2"><Avatar m={o} size={26} />{o.name}</span></td>
                  <td className="p-4 text-sm"><span className="block font-semibold">{fmtDate(t.due)}</span><span className="text-mute">{dueLabel(t.due, t.status === "done")}</span></td>
                  <td className="w-40 p-4"><ProgressBar value={taskProgress(t)} color={STATUS[t.status].color} label={`${t.title} progress`} h={8} /></td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={t.status} />
                      <label className="sr-only" htmlFor={`ls-${t.id}`}>Change status of {t.title}</label>
                      <select id={`ls-${t.id}`} className="rounded-md border border-[#8e99a5] bg-white px-1.5 py-1 text-xs font-semibold" value={t.status} onChange={(e) => s.setStatus(t.id, e.target.value as Status)}>
                        {STATUSES.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
            {s.filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-mute">No tasks match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
