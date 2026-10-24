import { useState } from "react";
import { ArrowLeftRight, Bell, LayoutDashboard, ListChecks, Loader2, LogOut, Settings as Cog, Undo2, Users, X, HeartHandshake, CheckCircle2, Info } from "lucide-react";
import { AuthProvider, useAuth } from "./auth";
import { StoreProvider, useStore, type View } from "./store";
import { Avatar, Confetti } from "./ui";
import ErrorBoundary from "./ErrorBoundary";
import Login, { Logo } from "./screens/Login";
import Projects from "./screens/Projects";
import Dashboard from "./screens/Dashboard";
import Tasks from "./screens/Tasks";
import Team from "./screens/Team";
import Settings from "./screens/Settings";
import TaskModal from "./screens/TaskModal";
import TaskDetail from "./screens/TaskDetail";
import Notifications from "./screens/Notifications";

const NAV: { id: View; label: string; icon: typeof Bell }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Cog },
];

const STEPS = [
  ["Your project at a glance", "The Dashboard shows overall progress, milestones and every task by status."],
  ["Navigate in one place", "The sidebar and top bar stay the same on every page, so you always know where you are."],
  ["Ask for help any time", "Mark a task as Stuck and your team is notified. It is a normal part of group work."],
  ["Reminders without nagging", "Task Mate sends neutral, automatic deadline reminders. Find them under the bell."],
];

function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div role="dialog" aria-label="Quick tour" className="animate-rise fixed bottom-6 right-6 z-40 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#1f4c7e] p-5 text-white shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-widest text-[#bcd8f5]">Quick tour · {i + 1} of {STEPS.length}</p>
      <h2 className="mt-1 text-lg font-extrabold">{STEPS[i][0]}</h2>
      <p className="mt-1 text-sm text-[#dbe9f8]">{STEPS[i][1]}</p>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={onDone} className="rounded-md px-2 py-1 text-sm font-semibold underline">Skip tour</button>
        <button type="button" data-autofocus className="btn btn-sm !border-white !bg-white !text-[#1f4c7e]" onClick={() => (i === STEPS.length - 1 ? onDone() : setI(i + 1))}>
          {i === STEPS.length - 1 ? "Got it" : "Next"}
        </button>
      </div>
    </div>
  );
}

function Toasts() {
  const s = useStore();
  const icon = { success: CheckCircle2, info: Info, support: HeartHandshake };
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 lg:left-[calc(50%+7.5rem)]" role="region" aria-label="Messages" aria-live="polite">
      {s.toasts.map((t) => {
        const Icon = icon[t.tone];
        const bg = t.tone === "support" ? "bg-[#7a4700]" : t.tone === "info" ? "bg-[#273240]" : "bg-[#1f6a2c]";
        return (
          <div key={t.id} role="status" className={`animate-rise flex items-center gap-3 rounded-xl ${bg} px-4 py-3 text-white shadow-xl`}>
            <Icon size={20} className="shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm font-semibold">{t.msg}</p>
            {t.undo && (
              <button type="button" onClick={() => s.undo(t.id)} className="inline-flex items-center gap-1 rounded-md border border-white/60 px-2.5 py-1 text-sm font-bold hover:bg-white/15">
                <Undo2 size={14} aria-hidden="true" /> Undo
              </button>
            )}
            <button type="button" aria-label="Dismiss message" onClick={() => s.dismissToast(t.id)} className="rounded-md p-1 hover:bg-white/15"><X size={16} aria-hidden="true" /></button>
          </div>
        );
      })}
    </div>
  );
}

const TOUR_KEY = "taskmate.tourDone";
const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center" role="status">
    <Loader2 size={32} className="animate-spin text-brand" aria-hidden="true" />
    <span className="sr-only">Loading Task Mate</span>
  </div>
);

function Shell() {
  const s = useStore();
  const { loading } = useAuth();
  const [tour, setTour] = useState(() => localStorage.getItem(TOUR_KEY) !== "1");
  const endTour = () => { localStorage.setItem(TOUR_KEY, "1"); setTour(false); };
  const unread = s.notifs.filter((n) => !n.read).length;
  const me = s.memberOf(s.me);

  if (loading) return <Spinner />;
  if (s.view === "login") return <Login />;
  if (s.view === "projects") return <Projects />;
  if (s.projectLoading) return <Spinner />;
  const Page = { dashboard: Dashboard, tasks: Tasks, team: Team, settings: Settings }[s.view as "dashboard"];

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">Skip to main content</a>
      {s.demo && (
        <p className="bg-[#273240] px-4 py-2 text-center text-sm font-semibold text-white">
          You&apos;re exploring the demo. Changes aren&apos;t saved. <button type="button" className="underline" onClick={s.signOut}>{s.user ? "Back to my projects" : "Sign in or create an account"}</button>
        </p>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Logo />
          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <p className="hidden truncate font-semibold sm:block"><span className="text-mute">Project:</span> {s.projectName}</p>
          {s.live && (
            <button type="button" className="btn btn-sm hidden md:inline-flex" onClick={s.leaveToPicker}><ArrowLeftRight size={14} aria-hidden="true" /> Switch</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => s.setNotifOpen(true)} className="btn relative !px-3" aria-label={`Notifications, ${unread} unread`}>
            <Bell size={20} aria-hidden="true" />
            <span className="hidden sm:inline">Notifications</span>
            {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[#a35a00] text-xs font-bold text-white" aria-hidden="true">{unread}</span>}
          </button>
          <button type="button" onClick={() => s.setView("team")} className="flex items-center gap-2 rounded-full p-1 hover:bg-canvas" aria-label={`${s.userName}, open team page`}>
            <Avatar m={me} size={38} />
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[15rem_1fr]">
        <aside className="border-b border-line bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
          <nav aria-label="Project sections" className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:p-4">
            {NAV.map(({ id, label, icon: I }) => {
              const on = s.view === id;
              return (
                <button key={id} type="button" aria-current={on ? "page" : undefined} onClick={() => s.setView(id)}
                  className={`flex min-h-12 items-center gap-3 whitespace-nowrap rounded-xl px-4 font-bold transition ${on ? "bg-brand text-white shadow-sm" : "text-ink hover:bg-brand-tint"}`}>
                  <I size={20} aria-hidden="true" /> {label}
                </button>
              );
            })}
          </nav>
          <div className="hidden px-6 pt-4 lg:block">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">Team</h2>
            <ul className="space-y-2.5">
              {s.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 text-sm font-semibold"><Avatar m={m} size={28} />{m.name.split(" ")[0]}<span className="ml-auto text-xs font-medium text-mute">{m.online ? "online" : "away"}</span></li>
              ))}
            </ul>
          </div>
          <div className="hidden p-4 lg:absolute lg:bottom-0 lg:block lg:w-full">
            <button type="button" className="btn w-full" onClick={s.signOut}><LogOut size={18} aria-hidden="true" /> {s.demo ? "Leave demo" : "Sign out"}</button>
          </div>
        </aside>

        <main id="main" tabIndex={-1} className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1200px]"><Page /></div>
        </main>
      </div>

      {s.createOpen && <TaskModal />}
      {s.openTask && <TaskDetail id={s.openTask} />}
      {s.notifOpen && <Notifications />}
      {s.celebrate && !s.prefs.calm && <Confetti />}
      {s.celebrate && <p className="sr-only" role="status">Task {s.celebrate} completed. Well done.</p>}
      {tour && <Onboarding onDone={endTour} />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
