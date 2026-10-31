import { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-sage bg-white px-3.5 py-2.5 text-ink placeholder:text-stone/60 " +
  "focus:border-fern focus:outline-none focus:ring-2 focus:ring-leaf/40 disabled:bg-mist disabled:text-stone";

/** Page title with a faint leaf drawing: the one decorative moment in the app. */
export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-[2rem] bg-dew px-7 py-7 sm:px-10">
      <svg aria-hidden className="pointer-events-none absolute -right-4 -top-6 h-48 w-48 text-leaf/25" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M50 96C50 60 50 40 50 6M50 6C20 20 10 55 50 96C90 55 80 20 50 6Z" />
        <path d="M50 70L28 52M50 56L30 38M50 70L72 52M50 56L70 38M50 42L38 30M50 42L62 30" />
      </svg>
      <h1 className="relative text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="relative mt-2 max-w-xl text-stone">{subtitle}</p>
    </header>
  );
}

export function Card({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-sage/80 bg-white p-6 shadow-[0_14px_30px_-20px_rgba(31,77,58,0.45)] ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-canopy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

export function Button({ children, loading, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="rounded-xl bg-fern px-5 py-2.5 font-medium text-white transition-colors hover:bg-canopy disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Saving..." : children}
    </button>
  );
}

const tones = {
  green: "bg-dew text-fern",
  amber: "bg-[#FBF0D9] text-amber",
  rust: "bg-[#F8E1DC] text-rust",
  neutral: "bg-mist text-stone",
};
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** Shows trigger / validation errors, e.g. "Not enough stock for batch 1 (available 20, requested 25)". */
export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return <div role="alert" className="mb-4 rounded-xl border border-rust/30 bg-[#FBEAE6] px-4 py-3 text-sm text-rust">{message}</div>;
}

export function SuccessNote({ message }: { message: string }) {
  if (!message) return null;
  return <div role="status" className="mb-4 rounded-xl border border-leaf/40 bg-dew px-4 py-3 text-sm text-fern">{message}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-sage px-4 py-6 text-center text-sm text-stone">{children}</p>;
}

export function Loading() {
  return <p className="py-4 text-sm text-stone" aria-live="polite">Loading...</p>;
}
