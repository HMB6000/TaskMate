import { useState } from "react";
import { Bell, CalendarDays, Copy, DoorOpen, Link2, RefreshCw, UserPlus } from "lucide-react";
import { STATUSES, dueLabel } from "../data";
import { useStore } from "../store";
import { leaveProject, regenerateInvite } from "../remote";
import { Avatar, Dialog, ProgressBar, STATUS, StatusBadge } from "../ui";

function InvitePanel() {
  const s = useStore();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const project = s.project;
  if (!s.live || !project) return null;
  const link = `${window.location.origin}${window.location.pathname}?join=${project.inviteCode}`;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      s.toast(`${what} copied. Share it with your group.`);
    } catch {
      s.toast(`Couldn't copy automatically. Select the ${what.toLowerCase()} and copy it.`, "info");
    }
  };
  const reset = () =>
    regenerateInvite(project).then(
      () => s.toast("New invite code created. The old one no longer works."),
      () => s.toast("Couldn't change the code. Please try again.", "info"),
    );
  const leave = () =>
    leaveProject(s.me, project.id).then(
      () => { s.leaveToPicker(); s.toast(`You left ${project.name}.`, "info"); },
      () => s.toast("Couldn't leave the project. Please try again.", "info"),
    );

  return (
    <section aria-labelledby="inv-h" className="card p-6">
      <h2 id="inv-h" className="flex items-center gap-2 text-xl font-extrabold"><UserPlus size={20} aria-hidden="true" /> Invite your group</h2>
      <p className="mt-1 text-sm text-mute">Anyone with this code or link can join {project.name}. Only share it with your teammates.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code className="rounded-xl border-2 border-dashed border-brand bg-brand-tint px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-brand-dark" aria-label={`Invite code ${project.inviteCode.split("").join(" ")}`}>
          {project.inviteCode}
        </code>
        <button type="button" className="btn btn-sm" onClick={() => copy(project.inviteCode, "Code")}><Copy size={14} aria-hidden="true" /> Copy code</button>
        <button type="button" className="btn btn-sm" onClick={() => copy(link, "Link")}><Link2 size={14} aria-hidden="true" /> Copy invite link</button>
        {s.isOwner && <button type="button" className="btn btn-sm" onClick={reset}><RefreshCw size={14} aria-hidden="true" /> New code</button>}
      </div>
      {!s.isOwner && (
        <button type="button" className="btn btn-danger btn-sm mt-5" onClick={() => setConfirmLeave(true)}><DoorOpen size={14} aria-hidden="true" /> Leave project</button>
      )}
      {confirmLeave && (
        <Dialog title="Leave project" onClose={() => setConfirmLeave(false)} labelId="lv-h">
          <div className="p-6">
            <h2 id="lv-h" className="text-xl font-extrabold">Leave {project.name}?</h2>
            <p className="mt-2 text-mute">Your tasks stay with the group. You can rejoin later with an invite code.</p>
            <div className="mt-6 flex justify-between gap-3">
              <button type="button" data-autofocus className="btn" onClick={() => setConfirmLeave(false)}>Cancel</button>
              <button type="button" className="btn btn-danger-solid" onClick={leave}><DoorOpen size={16} aria-hidden="true" /> Leave</button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}

export default function Team() {
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const total = s.tasks.length;
  const done = s.tasks.filter((t) => t.status === "done").length;
  const member = s.members.find((m) => m.id === sel);
  const mine = member ? s.tasks.filter((t) => t.owner === member.id) : [];
  const stats = s.members.map((m) => {
    const ts = s.tasks.filter((t) => t.owner === m.id);
    return { m, ts, done: ts.filter((t) => t.status === "done").length };
  });
  const maxDone = Math.max(1, ...stats.map((x) => x.done));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Team</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Team members</h1>
        <p className="mt-1 text-mute">Together the team has completed {done} of {total} tasks. Select a person to see what they are working on.</p>
      </div>

      <InvitePanel />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ m, ts, done: d }) => (
          <li key={m.id}>
            <button type="button" aria-pressed={sel === m.id} onClick={() => setSel(sel === m.id ? null : m.id)}
              className={`card block w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${sel === m.id ? "!border-brand ring-2 ring-brand" : ""}`}>
              <span className="flex items-center gap-3">
                <Avatar m={m} size={48} />
                <span>
                  <span className="block text-lg font-bold">{m.name}{m.id === s.me && <span className="ml-2 text-sm font-semibold text-mute">(you)</span>}</span>
                  <span className="block text-sm text-mute">{m.role || "Team member"} · {m.online ? "Online now" : "Offline"}</span>
                </span>
              </span>
              <span className="mt-4 block">
                <span className="mb-1.5 flex justify-between text-sm font-semibold"><span>{d} of {ts.length} completed</span></span>
                <ProgressBar value={ts.length ? Math.round((d / ts.length) * 100) : 0} label={`${m.name} completion`} h={8} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {member && (
        <section aria-labelledby="mp-h" className="card animate-rise p-6">
          <h2 id="mp-h" className="mb-4 flex items-center gap-3 text-xl font-extrabold"><Avatar m={member} size={36} /> {member.name}&apos;s tasks</h2>
          <ul className="divide-y divide-line">
            {mine.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <button type="button" className="font-bold hover:text-brand hover:underline" onClick={() => s.setOpenTask(t.id)}>{t.title}</button>
                  <p className="flex items-center gap-1 text-sm text-mute"><CalendarDays size={14} aria-hidden="true" /> {dueLabel(t.due, t.status === "done")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  {member.id !== s.me && t.status !== "done" && (
                    <button type="button" className="btn btn-sm" onClick={() => s.sendReminder(t.id)}><Bell size={14} aria-hidden="true" /> Send Reminder</button>
                  )}
                </div>
              </li>
            ))}
            {mine.length === 0 && <li className="py-3 text-mute">No tasks assigned yet.</li>}
          </ul>
        </section>
      )}

      <section aria-labelledby="tc-h" className="card p-6">
        <h2 id="tc-h" className="text-xl font-extrabold">Team contributions</h2>
        <p className="mb-5 text-sm text-mute">Tasks completed by each member. Every contribution counts towards the shared goal.</p>
        <ul className="space-y-4">
          {[...stats].sort((a, b) => b.done - a.done).map(({ m, done: d, ts }) => (
            <li key={m.id} className="grid grid-cols-[8rem_1fr_6rem] items-center gap-4 text-sm sm:grid-cols-[10rem_1fr_8rem]">
              <span className="flex items-center gap-2 font-semibold"><Avatar m={m} size={26} /> <span className="truncate">{m.name.split(" ")[0]}</span></span>
              <span className="h-5 overflow-hidden rounded-full bg-[#e3e8ed]" role="img" aria-label={`${m.name}: ${d} completed`}>
                <span className="block h-full rounded-full bg-leaf transition-[width] duration-700" style={{ width: `${(d / maxDone) * 100}%` }} />
              </span>
              <span className="font-semibold text-mute">{d} done · {ts.length - d} open</span>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4" aria-label="Legend">
          {STATUSES.map((k) => <li key={k}><StatusBadge status={k} /></li>)}
        </ul>
      </section>
      <span className="hidden">{STATUS.todo.label}</span>
    </div>
  );
}
