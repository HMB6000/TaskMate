import { Plus } from "lucide-react";
import { STATUSES, dueLabel, fmtDate, taskProgress, type Status } from "../data";
import { useStore } from "../store";
import { Avatar, ProgressBar, STATUS, StatusBadge } from "../ui";
import { Filters } from "./Dashboard";

export default function Tasks() {
  const s = useStore();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Tasks</p>
          <h1 className="text-4xl font-extrabold tracking-tight">All tasks</h1>
          <p className="mt-1 text-mute">A list view of every task with owner, deadline and status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => s.setCreateOpen(true)}><Plus size={18} aria-hidden="true" /> Add Task</button>
      </div>
      <Filters />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
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
