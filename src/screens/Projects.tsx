import { useEffect, useState } from "react";
import { ArrowRight, FolderPlus, KeyRound, Loader2, LogOut, MailWarning, Users } from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../auth";
import { JoinError, createProject, fetchProjects, joinProject } from "../remote";
import type { Project } from "../data";
import { Logo } from "./Login";

export default function Projects() {
  const s = useStore();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);

  const [pName, setPName] = useState("");
  const [pRole, setPRole] = useState("Project coordinator");
  const [code, setCode] = useState(s.pendingJoin);
  const [jRole, setJRole] = useState("");
  const [busy, setBusy] = useState<"" | "create" | "join">("");
  const [error, setError] = useState<{ form: "create" | "join"; msg: string } | null>(null);

  const ids = s.profile?.projectIds ?? [];
  const idsKey = ids.join(",");
  useEffect(() => {
    let cancelled = false;
    fetchProjects(ids).then((p) => !cancelled && setProjects(p.sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (!user || !s.profile) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-brand" aria-label="Loading" /></div>;
  }
  const name = s.profile.name;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return setError({ form: "create", msg: "Please give the project a name." });
    setBusy("create"); setError(null);
    try {
      const pid = await createProject(user.uid, name, pName.trim().slice(0, 80), pRole.trim().slice(0, 60) || "Team member");
      s.selectProject(pid);
    } catch (err) {
      console.error(err);
      setError({ form: "create", msg: "We couldn't create the project. Check your connection and try again." });
    } finally { setBusy(""); }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setError({ form: "join", msg: "Paste the invite code your teammate shared." });
    setBusy("join"); setError(null);
    try {
      const pid = await joinProject(user.uid, name, code, jRole.trim().slice(0, 60) || "Team member");
      s.selectProject(pid);
    } catch (err) {
      console.error(err);
      setError({ form: "join", msg: err instanceof JoinError ? err.message : "We couldn't join that project. The code may have been changed. Ask your teammate for a fresh one." });
    } finally { setBusy(""); }
  };

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
        <Logo />
        <button type="button" className="btn btn-sm" onClick={s.signOut}><LogOut size={16} aria-hidden="true" /> Sign out</button>
      </header>

      <main id="main" className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Your projects</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Hi {name.split(" ")[0]}, pick a project</h1>
          <p className="mt-1 text-mute">Open an existing project, start a new one, or join your group with an invite code.</p>
        </div>

        {!user.emailVerified && (
          <p className="flex items-start gap-2 rounded-xl bg-[#fdf0d8] p-3 text-sm font-medium text-[#6b3e00]">
            <MailWarning size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            We sent a verification link to {user.email}. Please confirm your email so you can always recover your account.
          </p>
        )}

        <section aria-labelledby="list-h" className="card p-6">
          <h2 id="list-h" className="mb-4 flex items-center gap-2 text-xl font-extrabold"><Users size={20} aria-hidden="true" /> Projects you&apos;re in</h2>
          {projects === null ? (
            <p className="flex items-center gap-2 text-mute"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading your projects…</p>
          ) : projects.length === 0 ? (
            <p className="text-mute">You&apos;re not in any projects yet. Create one below, or ask a teammate for their invite code.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => s.selectProject(p.id)}
                    className="card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                    <span>
                      <span className="block text-lg font-bold">{p.name}</span>
                      <span className="text-sm text-mute">{p.ownerId === user.uid ? "You created this" : "Member"}</span>
                    </span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={create} noValidate aria-labelledby="new-h" className="card space-y-4 p-6">
            <h2 id="new-h" className="flex items-center gap-2 text-xl font-extrabold"><FolderPlus size={20} aria-hidden="true" /> Start a new project</h2>
            <div>
              <label htmlFor="p-name" className="mb-1.5 block font-semibold">Project name</label>
              <input id="p-name" className="field" placeholder="e.g. Climate Policy Report" maxLength={80} value={pName} onChange={(e) => setPName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-role" className="mb-1.5 block font-semibold">Your role <span className="font-normal text-mute">(optional)</span></label>
              <input id="p-role" className="field" maxLength={60} value={pRole} onChange={(e) => setPRole(e.target.value)} />
            </div>
            {error?.form === "create" && <p role="alert" className="text-sm font-medium text-[#a32d26]">{error.msg}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={!!busy}>
              {busy === "create" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <FolderPlus size={18} aria-hidden="true" />} Create project
            </button>
          </form>

          <form onSubmit={join} noValidate aria-labelledby="join-h" className={`card space-y-4 p-6 ${s.pendingJoin ? "ring-2 ring-brand" : ""}`}>
            <h2 id="join-h" className="flex items-center gap-2 text-xl font-extrabold"><KeyRound size={20} aria-hidden="true" /> Join with an invite code</h2>
            <div>
              <label htmlFor="j-code" className="mb-1.5 block font-semibold">Invite code</label>
              <input id="j-code" className="field font-mono uppercase tracking-widest" placeholder="ABCD2345" maxLength={12} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div>
              <label htmlFor="j-role" className="mb-1.5 block font-semibold">Your role <span className="font-normal text-mute">(optional)</span></label>
              <input id="j-role" className="field" placeholder="e.g. Research lead" maxLength={60} value={jRole} onChange={(e) => setJRole(e.target.value)} />
            </div>
            {error?.form === "join" && <p role="alert" className="text-sm font-medium text-[#a32d26]">{error.msg}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={!!busy}>
              {busy === "join" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />} Join project
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-mute">
          Just looking around? <button type="button" className="font-semibold text-brand underline" onClick={s.enterDemo}>Open the demo project</button>
        </p>
      </main>
    </div>
  );
}
