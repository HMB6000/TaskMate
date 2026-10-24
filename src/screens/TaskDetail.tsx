import { useState } from "react";
import { Bell, CalendarClock, HeartHandshake, Reply, Send, Trash2, UserPlus } from "lucide-react";
import { STATUSES, dueLabel, fmtDate, fmtTime, taskProgress, today } from "../data";
import { useStore } from "../store";
import { Avatar, CloseButton, Dialog, ProgressBar, STATUS, StatusBadge, Tooltip } from "../ui";

export default function TaskDetail({ id }: { id: string }) {
  const s = useStore();
  const task = s.tasks.find((t) => t.id === id);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [confirm, setConfirm] = useState<null | { kind: "task" } | { kind: "comment"; id: string }>(null);
  const [dueDraft, setDueDraft] = useState("");
  if (!task) return null;
  const { memberOf } = s;
  const owner = memberOf(task.owner);
  const close = () => s.setOpenTask(null);
  const pct = taskProgress(task);
  const dueErr = dueDraft && dueDraft < today() ? "Please enter a valid date. Deadlines cannot be in the past." : "";
  const replyTarget = task.comments.find((c) => c.id === replyTo);

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    s.addComment(id, text.trim(), replyTo);
    setText("");
    setReplyTo(undefined);
  };

  return (
    <>
      <Dialog title={task.title} onClose={close} side labelId="td-h">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div className="min-w-0">
            <StatusBadge status={task.status} />
            <h2 id="td-h" className="mt-3 text-3xl font-extrabold tracking-tight">{task.title}</h2>
            <p className="mt-2 text-mute">{task.desc || "No description yet."}</p>
          </div>
          <CloseButton onClick={close} label="Close task details" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-quiet">
          <section aria-labelledby="st-h" className="border-b border-line p-6">
            <h3 id="st-h" className="mb-3 font-bold">Status</h3>
            <div role="radiogroup" aria-label="Task status" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((k) => {
                const m = STATUS[k];
                const Icon = m.icon;
                const on = task.status === k;
                return (
                  <Tooltip key={k} text={m.help}>
                    <label className={`relative flex min-h-12 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-2 text-sm font-bold transition hover:-translate-y-px has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1b4f8f] ${on ? m.chip : "border-line bg-white text-ink hover:bg-canvas"}`} style={on ? { borderColor: m.color } : undefined}>
                      <input type="radio" name="status" className="sr-only" checked={on} onChange={() => s.setStatus(id, k)} />
                      <Icon size={16} aria-hidden="true" /> {m.label}
                    </label>
                  </Tooltip>
                );
              })}
            </div>
            {task.status === "stuck" && (
              <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-[#fdf0d8] p-3 text-sm font-medium text-[#6b3e00]">
                <HeartHandshake size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                Your team has been notified. Someone will help soon. Asking for help is a normal part of group work.
              </p>
            )}
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>Task progress</span><span>{pct}%</span></div>
              <ProgressBar value={pct} color={STATUS[task.status].color} label={`${task.title} progress`} h={12} />
            </div>
          </section>

          <section aria-labelledby="dt-h" className="grid gap-5 border-b border-line p-6 sm:grid-cols-2">
            <h3 id="dt-h" className="sr-only">Owner and deadline</h3>
            <div>
              <label htmlFor="d-owner" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold"><UserPlus size={16} aria-hidden="true" /> Assign Member</label>
              <div className="flex items-center gap-2">
                <Avatar m={owner} size={36} />
                <select id="d-owner" className="field" value={task.owner} onChange={(e) => s.assign(id, e.target.value)}>
                  {s.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  {!s.members.some((m) => m.id === task.owner) && <option value={task.owner}>{owner.name}</option>}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="d-due" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold"><CalendarClock size={16} aria-hidden="true" /> Set Deadline</label>
              <input id="d-due" type="date" min={today()} className="field" value={dueDraft || task.due}
                onChange={(e) => { setDueDraft(e.target.value); if (e.target.value && e.target.value >= today()) { s.setDue(id, e.target.value); setDueDraft(""); } }}
                aria-invalid={!!dueErr} aria-describedby="d-due-msg" />
              <p id="d-due-msg" role={dueErr ? "alert" : undefined} className={`mt-1 text-sm font-medium ${dueErr ? "text-[#a32d26]" : "text-mute"}`}>
                {dueErr || `${fmtDate(task.due)} · ${dueLabel(task.due, task.status === "done")}`}
              </p>
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="btn btn-sm" onClick={() => s.sendReminder(id)} disabled={task.status === "done"}>
                <Bell size={16} aria-hidden="true" /> Send Reminder
              </button>
              <span className="ml-3 text-sm text-mute">Reminders are automatic too. This sends one now.</span>
            </div>
          </section>

          {task.subtasks.length > 0 && (
            <section aria-labelledby="sub-h" className="border-b border-line p-6">
              <h3 id="sub-h" className="mb-3 font-bold">Sub-tasks <span className="font-normal text-mute">({task.subtasks.filter((x) => x.done).length} of {task.subtasks.length})</span></h3>
              <ul className="space-y-1">
                {task.subtasks.map((st) => (
                  <li key={st.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-canvas">
                      <input type="checkbox" className="size-5 accent-[#2f6fb5]" checked={st.done} onChange={() => s.toggleSubtask(id, st.id)} />
                      <span className={st.done ? "text-mute line-through" : ""}>{st.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="cf-h" className="p-6">
            <h3 id="cf-h" className="mb-4 font-bold">Comments and activity</h3>
            <ol className="space-y-4" aria-live="polite">
              {task.comments.map((c) => {
                if (c.author === "system")
                  return (
                    <li key={c.id} className="flex items-center gap-3 text-sm text-mute">
                      <span className="h-px flex-1 bg-line" />
                      <span className="max-w-[80%] text-center">{c.text} <time dateTime={c.at}>{fmtTime(c.at)}</time></span>
                      <span className="h-px flex-1 bg-line" />
                    </li>
                  );
                const m = memberOf(c.author);
                const parent = c.replyTo ? task.comments.find((x) => x.id === c.replyTo) : undefined;
                return (
                  <li key={c.id} className={`flex gap-3 ${c.replyTo ? "ml-8" : ""}`}>
                    <Avatar m={m} size={34} />
                    <article className="min-w-0 flex-1 animate-rise rounded-2xl rounded-tl-sm bg-canvas p-3.5">
                      <header className="flex flex-wrap items-baseline gap-x-2">
                        <strong>{m.name}</strong>
                        <time dateTime={c.at} className="text-xs text-mute">{fmtTime(c.at)}</time>
                      </header>
                      {parent && <p className="mt-1 border-l-2 border-line pl-2 text-xs text-mute">Replying to {memberOf(parent.author)?.name}</p>}
                      <p className="mt-1">{c.text}</p>
                      <div className="mt-2 flex gap-1">
                        <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-brand hover:bg-white" onClick={() => { setReplyTo(c.replyTo ?? c.id); document.getElementById("c-text")?.focus(); }}>
                          <Reply size={14} aria-hidden="true" /> Reply
                        </button>
                        {c.author === s.me && (
                          <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-[#a32d26] hover:bg-white" onClick={() => setConfirm({ kind: "comment", id: c.id })}>
                            <Trash2 size={14} aria-hidden="true" /> Delete
                          </button>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
              {task.comments.length === 0 && <li className="text-mute">No comments yet. Post an update or ask a question.</li>}
            </ol>
          </section>

          <section aria-labelledby="dz-h" className="mx-6 mb-6 mt-2 rounded-xl border border-dashed border-[#d9a9a5] p-4">
            <h3 id="dz-h" className="text-sm font-bold">Remove this task</h3>
            <p className="mb-3 text-sm text-mute">Deleting removes the task and its comments for everyone. You can undo straight afterwards.</p>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm({ kind: "task" })}>
              <Trash2 size={16} aria-hidden="true" /> Delete task
            </button>
          </section>
        </div>

        <form onSubmit={post} className="border-t border-line bg-white p-4">
          {replyTarget && (
            <p className="mb-2 flex items-center justify-between rounded-lg bg-brand-tint px-3 py-1.5 text-sm">
              Replying to {memberOf(replyTarget.author)?.name}
              <button type="button" className="font-bold text-brand underline" onClick={() => setReplyTo(undefined)}>Cancel reply</button>
            </p>
          )}
          <label htmlFor="c-text" className="sr-only">Write a comment</label>
          <div className="flex gap-2">
            <input id="c-text" className="field" placeholder="Post an update or ask a question" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}><Send size={16} aria-hidden="true" /> Post</button>
          </div>
        </form>
      </Dialog>

      {confirm && (
        <Dialog title="Confirm delete" onClose={() => setConfirm(null)} labelId="cf-title">
          <div className="p-6">
            <h2 id="cf-title" className="text-xl font-extrabold">Are you sure?</h2>
            <p className="mt-2 text-mute">
              {confirm.kind === "task" ? `This will delete "${task.title}" and all of its comments.` : "This will delete your comment."} You can undo it afterwards.
            </p>
            <div className="mt-6 flex justify-between gap-3">
              <button type="button" data-autofocus className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="btn btn-danger-solid" onClick={() => {
                if (confirm.kind === "task") s.deleteTask(id); else s.deleteComment(id, confirm.id);
                setConfirm(null);
              }}><Trash2 size={16} aria-hidden="true" /> Delete</button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
