import { BellRing, CheckCheck, X } from "lucide-react";
import { fmtTime } from "../data";
import { useStore } from "../store";
import { CloseButton, Dialog } from "../ui";

export default function Notifications() {
  const s = useStore();
  const close = () => s.setNotifOpen(false);
  const unread = s.notifs.filter((n) => !n.read).length;
  return (
    <Dialog title="Notifications" onClose={close} side labelId="nt-h">
      <div className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div>
          <h2 id="nt-h" className="flex items-center gap-2 text-2xl font-extrabold"><BellRing size={22} aria-hidden="true" /> Notifications</h2>
          <p className="mt-1 text-sm text-mute">{unread ? `${unread} unread. ` : "All caught up. "}Messages stay here until you dismiss them.</p>
        </div>
        <CloseButton onClick={close} label="Close notifications" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <button type="button" className="btn btn-sm mb-5" onClick={s.markAllRead} disabled={!unread}><CheckCheck size={16} aria-hidden="true" /> Mark all as read</button>
        <ul className="space-y-3">
          {s.notifs.map((n) => (
            <li key={n.id} className={`flex gap-3 rounded-2xl border p-4 ${n.read ? "border-line bg-white" : "border-[#b8d3f0] bg-brand-tint"}`}>
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{!n.read && <span className="sr-only">Unread: </span>}{n.text}</p>
                <time dateTime={n.at} className="text-xs text-mute">{fmtTime(n.at)}</time>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.taskId && s.tasks.some((t) => t.id === n.taskId) && (
                    <button type="button" className="btn btn-sm" onClick={() => { s.markRead(n.id); s.setNotifOpen(false); s.setOpenTask(n.taskId!); }}>Open task</button>
                  )}
                  {!n.read && <button type="button" className="btn btn-sm" onClick={() => s.markRead(n.id)}>Mark as read</button>}
                </div>
              </div>
              <button type="button" aria-label="Dismiss notification" className="h-fit rounded-md p-1.5 hover:bg-white" onClick={() => s.dismissNotif(n.id)}><X size={16} aria-hidden="true" /></button>
            </li>
          ))}
          {s.notifs.length === 0 && <li className="rounded-2xl border border-dashed border-line p-8 text-center text-mute">Nothing new. Reminders will appear here automatically.</li>}
        </ul>
      </div>
    </Dialog>
  );
}
