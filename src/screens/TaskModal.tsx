import { useState } from "react";
import { CalendarClock, Plus, UserPlus, X } from "lucide-react";
import { today } from "../data";
import { useStore } from "../store";
import { CloseButton, Dialog } from "../ui";

export default function TaskModal() {
  const { addTask, setCreateOpen, members, me } = useStore();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [owner, setOwner] = useState(me);
  const [due, setDue] = useState("");
  const [sub, setSub] = useState("");
  const [subs, setSubs] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const dueErr = !due ? "Please choose a deadline." : due < today() ? "Please enter a valid date. Deadlines cannot be in the past." : "";
  const titleErr = !title.trim() ? "Please give the task a name." : "";
  const close = () => setCreateOpen(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (titleErr || dueErr) return;
    addTask({ title: title.trim(), desc: desc.trim(), owner, due, subtasks: subs });
    close();
  };
  const addSub = () => {
    if (sub.trim() && subs.length < 30) { setSubs([...subs, sub.trim()]); setSub(""); }
  };

  return (
    <Dialog title="Create task" onClose={close} wide labelId="ct-h">
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
        <div className="flex items-start justify-between border-b border-line p-6">
          <div>
            <h2 id="ct-h" className="text-2xl font-extrabold">Create task</h2>
            <p className="mt-1 text-sm text-mute">Fields marked with * are required.</p>
          </div>
          <CloseButton onClick={close} label="Close create task" />
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          <div>
            <label htmlFor="t-title" className="mb-1.5 block font-semibold">Task name *</label>
            <input id="t-title" data-autofocus className="field" placeholder="e.g. Write the discussion section" value={title} maxLength={200}
              onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)}
              aria-invalid={touched && !!titleErr} aria-describedby="t-title-err" aria-required="true" />
            <p id="t-title-err" role={touched && titleErr ? "alert" : undefined} className="mt-1 min-h-5 text-sm font-medium text-[#a32d26]">{touched && titleErr}</p>
          </div>
          <div>
            <label htmlFor="t-desc" className="mb-1.5 block font-semibold">Description</label>
            <textarea id="t-desc" rows={3} className="field" placeholder="What does done look like?" value={desc} maxLength={5000} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="t-owner" className="mb-1.5 flex items-center gap-1.5 font-semibold"><UserPlus size={16} aria-hidden="true" /> Assign member *</label>
              <select id="t-owner" className="field" value={owner} onChange={(e) => setOwner(e.target.value)}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.id === me ? " (you)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="t-due" className="mb-1.5 flex items-center gap-1.5 font-semibold"><CalendarClock size={16} aria-hidden="true" /> Set deadline *</label>
              <input id="t-due" type="date" min={today()} className="field" value={due} onChange={(e) => setDue(e.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={touched && !!dueErr} aria-describedby="t-due-err" aria-required="true" />
              <p id="t-due-err" role={dueErr && (touched || due) ? "alert" : undefined} className="mt-1 min-h-5 text-sm font-medium text-[#a32d26]">{(touched || due) && dueErr}</p>
            </div>
          </div>
          <div>
            <label htmlFor="t-sub" className="mb-1.5 block font-semibold">Sub-tasks <span className="font-normal text-mute">(optional)</span></label>
            <div className="flex gap-2">
              <input id="t-sub" className="field" placeholder="Add a smaller step" value={sub} maxLength={200} onChange={(e) => setSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} />
              <button type="button" className="btn" onClick={addSub}><Plus size={18} aria-hidden="true" /> Add</button>
            </div>
            {subs.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {subs.map((s, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-sm">
                    {s}
                    <button type="button" aria-label={`Remove sub-task ${s}`} className="rounded p-1 hover:bg-white" onClick={() => setSubs(subs.filter((_, j) => j !== i))}><X size={16} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line p-5">
          <button type="button" className="btn" onClick={close}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()} aria-describedby={!title.trim() ? "ct-hint" : undefined}>
            <Plus size={18} aria-hidden="true" /> Create Task
          </button>
        </div>
        {!title.trim() && <p id="ct-hint" className="-mt-2 px-5 pb-4 text-right text-sm text-mute">Enter a task name to enable Create Task.</p>}
      </form>
    </Dialog>
  );
}
