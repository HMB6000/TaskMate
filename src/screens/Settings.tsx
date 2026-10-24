import { useState } from "react";
import { Save } from "lucide-react";
import { useStore, type Prefs } from "../store";
import { Switch } from "../ui";

export default function Settings() {
  const s = useStore();
  const [d, setD] = useState<Prefs>(s.prefs);
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setD({ ...d, [k]: v });
  const dirty = JSON.stringify(d) !== JSON.stringify(s.prefs);
  const sizes = [[1, "Default"], [1.15, "Large"], [1.3, "Extra large"]] as const;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Settings</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Accessibility and preferences</h1>
        <p className="mt-1 text-mute">Make Task Mate work the way you do. Changes apply when you save.</p>
      </div>

      <section aria-labelledby="dp-h" className="card p-6">
        <h2 id="dp-h" className="text-xl font-extrabold">Display</h2>
        <fieldset className="mt-4">
          <legend className="font-semibold">Text size</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {sizes.map(([v, l]) => (
              <label key={l} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 px-3 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1b4f8f] ${d.scale === v ? "border-brand bg-brand-tint text-brand-dark" : "border-line hover:bg-canvas"}`} style={{ fontSize: `${v}rem` }}>
                <input type="radio" name="size" className="sr-only" checked={d.scale === v} onChange={() => set("scale", v)} /> {l}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-2 divide-y divide-line">
          <Switch checked={d.contrast} onChange={(v) => set("contrast", v)} label="High contrast" hint="Darker text and stronger borders." />
          <Switch checked={d.spacious} onChange={(v) => set("spacious", v)} label="Extra text spacing" hint="More space between lines, words and letters. Helpful for dyslexia." />
          <Switch checked={d.calm} onChange={(v) => set("calm", v)} label="Reduce motion" hint="Turns off animations, confetti and moving progress bars." />
        </div>
      </section>

      <section aria-labelledby="nf-h" className="card p-6">
        <h2 id="nf-h" className="text-xl font-extrabold">Notifications</h2>
        <p className="text-sm text-mute">Notifications stay in your panel until you dismiss them. Nothing disappears on its own.</p>
        <div className="mt-2 divide-y divide-line">
          <Switch checked={d.remind} onChange={(v) => set("remind", v)} label="Deadline reminders" hint="A neutral reminder 2 days before each of your deadlines." />
          <Switch checked={d.stuckAlerts} onChange={(v) => set("stuckAlerts", v)} label="Help requests" hint="Be told when a teammate marks a task as Stuck." />
          <Switch checked={d.comments} onChange={(v) => set("comments", v)} label="New comments" hint="Replies and updates on tasks you own." />
        </div>
      </section>

      <section aria-labelledby="kb-h" className="card p-6">
        <h2 id="kb-h" className="text-xl font-extrabold">Keyboard guide</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {[["Tab / Shift + Tab", "Move between controls"], ["Enter / Space", "Press buttons and tick boxes"], ["Arrow keys", "Change a status or choose from a list"], ["Esc", "Close any panel or dialog"], ["Move to menu", "Move a task card without dragging"]].map(([k, v]) => (
            <div key={k} className="contents"><dt><kbd className="rounded-md border border-[#8e99a5] bg-canvas px-2 py-0.5 font-mono text-xs font-bold">{k}</kbd></dt><dd className="text-mute">{v}</dd></div>
          ))}
        </dl>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn" disabled={!dirty} onClick={() => setD(s.prefs)}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!dirty} onClick={() => s.savePrefs(d)}><Save size={18} aria-hidden="true" /> Save changes</button>
      </div>
    </div>
  );
}
