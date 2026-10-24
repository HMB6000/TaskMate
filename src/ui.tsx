import { useEffect, useId, useRef, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Circle, Loader, X } from "lucide-react";
import type { Member, Status } from "./data";

export const STATUS: Record<
  Status,
  { label: string; icon: typeof Circle; chip: string; color: string; help: string; soft: string }
> = {
  todo: {
    label: "To Do", icon: Circle, color: "#8b95a1", soft: "#eceff1",
    chip: "bg-[#eceff1] text-[#4a535c] border-[#c9d0d6]",
    help: "Not started yet. Ready for someone to pick up.",
  },
  progress: {
    label: "In Progress", icon: Loader, color: "#4a90d9", soft: "#e5effa",
    chip: "bg-[#e5effa] text-[#1f589b] border-[#b8d3f0]",
    help: "Someone is actively working on this.",
  },
  stuck: {
    label: "Stuck", icon: AlertTriangle, color: "#f0ad4e", soft: "#fdf0d8",
    chip: "bg-[#fdf0d8] text-[#7a4700] border-[#f0cf94]",
    help: "Blocked or unsure how to continue. Asking for help is normal; teammates are notified.",
  },
  done: {
    label: "Completed", icon: CheckCircle2, color: "#5cb85c", soft: "#e4f3e4",
    chip: "bg-[#e4f3e4] text-[#25622a] border-[#b3dbb5]",
    help: "Finished and checked.",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${s.chip}`}>
      <Icon size={14} aria-hidden="true" className={status === "done" ? "animate-pop" : ""} />
      {s.label}
    </span>
  );
}

export function Avatar({ m, size = 32, ring = false }: { m: Member; size?: number; ring?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" title={m.name}>
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold text-white ${ring ? "ring-2 ring-white" : ""}`}
        style={{ width: size, height: size, background: m.color, fontSize: size * 0.38 }}
        aria-hidden="true"
      >
        {m.name.split(" ").map((p) => p[0]).join("")}
      </span>
      {m.online && (
        <>
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#3fa43f]" aria-hidden="true" />
          <span className="sr-only">{m.name} is online</span>
        </>
      )}
    </span>
  );
}

export function ProgressBar({ value, color, label, h = 10 }: { value: number; color?: string; label: string; h?: number }) {
  const c = color ?? (value >= 100 ? "#5cb85c" : "#4a90d9");
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} percent`}
      className="w-full overflow-hidden rounded-full bg-[#e3e8ed]"
      style={{ height: h }}
    >
      <div
        className="h-full rounded-full transition-[width,background-color] duration-700 ease-out"
        style={{ width: `${value}%`, background: c }}
      />
    </div>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-40 mb-2 w-52 -translate-x-1/2 rounded-lg bg-[#273240] px-3 py-2 text-xs font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function Dialog({
  title, onClose, children, side = false, wide = false, labelId,
}: {
  title: string; onClose: () => void; children: ReactNode; side?: boolean; wide?: boolean; labelId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
        (n) => !n.hasAttribute("disabled"),
      );
    (el.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={`fixed inset-0 z-50 flex bg-[#1d2a38]/45 ${side ? "justify-end" : "items-center justify-center p-4"}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId ?? id}
        tabIndex={-1}
        className={`animate-rise flex max-h-full flex-col bg-white shadow-2xl ${
          side ? "h-full w-full max-w-2xl" : `w-full ${wide ? "max-w-xl" : "max-w-md"} rounded-2xl`
        }`}
      >
        {!labelId && <h2 id={id} className="sr-only">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="btn btn-sm !min-h-10 !px-2.5">
      <X size={18} aria-hidden="true" />
    </button>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <div id={id} className="font-semibold">{label}</div>
        {hint && <div className="text-sm text-mute">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border-2 transition-colors ${
          checked ? "border-brand-dark bg-brand" : "border-[#6b7580] bg-white"
        }`}
      >
        <span className={`absolute flex size-5 items-center justify-center rounded-full transition-all ${checked ? "left-9 bg-white text-brand" : "left-1.5 bg-[#6b7580] text-white"}`}>
          {checked && <Check size={13} strokeWidth={3} aria-hidden="true" />}
        </span>
        <span className={`absolute text-[10px] font-bold ${checked ? "left-2.5 text-white" : "right-2 text-[#4a535c]"}`} aria-hidden="true">
          {checked ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}

export function Confetti() {
  const colors = ["#4a90d9", "#5cb85c", "#f0ad4e", "#8a5a9e", "#e86f6f"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 48 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${(i * 37) % 100}%`,
            width: 8 + (i % 3) * 3,
            height: 12 + (i % 4) * 2,
            background: colors[i % colors.length],
            borderRadius: i % 2 ? 2 : 99,
            animation: `confetti ${1.8 + (i % 5) * 0.3}s ${(i % 8) * 0.07}s ease-in forwards`,
            ["--dx" as string]: `${((i % 7) - 3) * 40}px`,
            ["--rot" as string]: `${360 + i * 20}deg`,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-1/3 flex -translate-x-1/2 flex-col items-center">
        <svg viewBox="0 0 64 64" className="animate-pop size-24 drop-shadow-lg">
          <circle cx="32" cy="32" r="30" fill="#5cb85c" />
          <path className="draw" d="M18 33 l9 9 l19 -20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
