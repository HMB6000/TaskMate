import { useState } from "react";
import { ArrowRight, BellRing, CheckCircle2, Eye, Loader2, LogIn, MessagesSquare, UserPlus } from "lucide-react";
import { useStore } from "../store";
import { authErrorMessage, useAuth } from "../auth";
import { firebaseConfigured } from "../firebase";
import { ProgressBar } from "../ui";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
      <span className="relative inline-flex size-9 items-center justify-center rounded-xl bg-brand text-white" aria-hidden="true">
        <CheckCircle2 size={20} />
      </span>
      <span className={light ? "text-white" : "text-ink"}>Task Mate</span>
    </span>
  );
}

type Mode = "signin" | "signup" | "reset";

export default function Login() {
  const { enterDemo } = useStore();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const nameErr = mode === "signup" && !name.trim() ? "Please tell your team what to call you." : "";
  const emailErr = !/^\S+@\S+\.\S+$/.test(email) ? "Please enter a valid email address, like alex@uni.ac.uk." : "";
  const pwErr = mode !== "reset" && pw.length < 6 ? "Your password needs at least 6 characters." : "";

  const switchMode = (m: Mode) => {
    setMode(m);
    setTouched(false);
    setError("");
    setInfo("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    setInfo("");
    if (nameErr || emailErr || pwErr) return;
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email.trim(), pw);
      else if (mode === "signup") await signUp(name.trim(), email.trim(), pw);
      else {
        await resetPassword(email.trim());
        setInfo("If an account exists for that email, a reset link is on its way. Check your inbox.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const heading = { signin: "Welcome back", signup: "Create your account", reset: "Reset your password" }[mode];
  const sub = {
    signin: "Sign in with your email to open your projects.",
    signup: "It takes a minute. Then create a project or join one with an invite code.",
    reset: "Enter your email and we'll send you a link to choose a new password.",
  }[mode];
  const cta = { signin: "Sign in", signup: "Create account", reset: "Send reset link" }[mode];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section aria-labelledby="hero" className="relative flex flex-col justify-between overflow-hidden bg-[#1f4c7e] p-8 text-white sm:p-14">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-soft/30" />
        <div aria-hidden="true" className="absolute -bottom-32 left-10 size-80 rounded-full bg-leaf/20" />
        <Logo light />
        <div className="relative my-14 max-w-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#bcd8f5]">Group projects, shared fairly</p>
          <h1 id="hero" className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Everyone can see<br />who is doing what.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#dbe9f8]">
            Task Mate makes accountability visible and neutral, so nobody has to nag and nobody gets left carrying the group.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              [CheckCircle2, "Clear owners, deadlines and live progress"],
              [BellRing, "Automatic reminders in neutral language"],
              [MessagesSquare, "One comment feed for every task"],
              [Eye, "Built for accessibility from the start"],
            ].map(([I, t]) => {
              const Icon = I as typeof Eye;
              return (
                <li key={t as string} className="flex items-center gap-3 text-[#eef5fc]">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white/15"><Icon size={18} aria-hidden="true" /></span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="relative max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur">
          <div className="mb-2 flex justify-between text-sm font-semibold"><span>Our group report</span><span>68%</span></div>
          <ProgressBar value={68} label="Sample project progress" color="#7fd37f" />
        </div>
      </section>

      <main className="flex items-center justify-center bg-white p-8">
        <form onSubmit={submit} noValidate className="w-full max-w-sm" aria-labelledby="login-h">
          {mode !== "reset" && (
            <div role="tablist" aria-label="Account" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button key={m} type="button" role="tab" id={`tab-${m}`} aria-selected={mode === m} onClick={() => switchMode(m)}
                  className={`min-h-11 rounded-lg font-bold transition ${mode === m ? "bg-white text-ink shadow-sm" : "text-mute hover:text-ink"}`}>
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          <h2 id="login-h" className="text-3xl font-extrabold tracking-tight">{heading}</h2>
          <p className="mt-2 text-mute">{sub}</p>

          {!firebaseConfigured && (
            <p role="alert" className="mt-6 rounded-xl bg-[#fdf0d8] p-3 text-sm font-medium text-[#6b3e00]">
              Accounts aren&apos;t set up on this copy of Task Mate yet. You can still explore the demo project below.
            </p>
          )}

          {mode === "signup" && (
            <div className="mt-8">
              <label htmlFor="name" className="mb-1.5 block font-semibold">Your name</label>
              <input id="name" autoComplete="name" className="field" placeholder="Alex Rivera" value={name} maxLength={60}
                onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={touched && !!nameErr} aria-describedby="name-err" />
              <p id="name-err" role={touched && nameErr ? "alert" : undefined} className="mt-1.5 min-h-5 text-sm font-medium text-[#a32d26]">{touched && nameErr}</p>
            </div>
          )}

          <div className={mode === "signup" ? "mt-2" : "mt-8"}>
            <label htmlFor="email" className="mb-1.5 block font-semibold">Email</label>
            <input id="email" type="email" autoComplete="email" className="field" placeholder="alex@uni.ac.uk" value={email}
              onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)}
              aria-invalid={touched && !!emailErr} aria-describedby="email-err" />
            <p id="email-err" role={touched && emailErr ? "alert" : undefined} className="mt-1.5 min-h-5 text-sm font-medium text-[#a32d26]">{touched && emailErr}</p>
          </div>

          {mode !== "reset" && (
            <div className="mt-2">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="pw" className="block font-semibold">Password</label>
                {mode === "signin" && (
                  <button type="button" className="text-sm font-semibold text-brand underline" onClick={() => switchMode("reset")}>Forgot password?</button>
                )}
              </div>
              <input id="pw" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="field" placeholder="At least 6 characters" value={pw}
                onChange={(e) => setPw(e.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={touched && !!pwErr} aria-describedby="pw-err" />
              <p id="pw-err" role={touched && pwErr ? "alert" : undefined} className="mt-1.5 min-h-5 text-sm font-medium text-[#a32d26]">{touched && pwErr}</p>
            </div>
          )}

          {error && <p role="alert" className="mt-2 rounded-xl bg-[#fbe9e7] p-3 text-sm font-medium text-[#a32d26]">{error}</p>}
          {info && <p role="status" className="mt-2 rounded-xl bg-[#e4f3e4] p-3 text-sm font-medium text-[#25622a]">{info}</p>}

          <button type="submit" className="btn btn-primary mt-4 w-full" disabled={busy || !firebaseConfigured}>
            {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : mode === "signup" ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            {busy ? "Please wait…" : cta}
          </button>

          {mode === "reset" && (
            <button type="button" className="btn mt-3 w-full" onClick={() => switchMode("signin")}>Back to sign in</button>
          )}

          <div className="my-5 flex items-center gap-3 text-sm text-mute"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          <button type="button" className="btn w-full" onClick={enterDemo}>
            Explore the demo project <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="mt-2 text-center text-xs text-mute">The demo uses sample data and nothing is saved.</p>
        </form>
      </main>
    </div>
  );
}
