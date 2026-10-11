import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { formatDelta } from '../../i18n/de';
import { goBack } from '../../router';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-90',
  secondary: 'bg-surface-2 text-ink hover:bg-line',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'text-bad hover:bg-bad/10',
};

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-medium transition
        disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`block w-full rounded-2xl border border-line bg-surface p-4 text-left ${
        onClick ? 'transition hover:border-muted/50 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Square 48px touch target for icon-only actions (back, share, reorder). */
export function IconButton({
  label,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink transition hover:bg-line
        disabled:pointer-events-none disabled:opacity-30 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export const BackIcon = () => (
  <svg {...iconProps}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const ArrowUpIcon = () => (
  <svg {...iconProps}>
    <path d="M5 15l7-7 7 7" />
  </svg>
);
export const ArrowDownIcon = () => (
  <svg {...iconProps}>
    <path d="M5 9l7 7 7-7" />
  </svg>
);
export const ShareIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);

/** Page frame with sticky header, optional back button and right-hand action. */
export function Screen({
  title,
  back,
  action,
  children,
  footer,
}: {
  title: ReactNode;
  back?: string | (() => void);
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const onBack = typeof back === 'function' ? back : back !== undefined ? () => goBack(back) : undefined;
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 bg-paper/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        {onBack && (
          <IconButton label="Zurück" onClick={onBack}>
            <BackIcon />
          </IconButton>
        )}
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
        {action}
      </header>
      <main className="flex-1 px-4 pt-2 pb-8">{children}</main>
      {footer && (
        <footer className="sticky bottom-0 z-10 border-t border-line/60 bg-paper/90 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-6 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{children}</h2>;
}

/** Big +/- number input suited for touch. */
export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  size = 'lg',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'lg' | 'md';
}) {
  const btn = size === 'lg' ? 'size-20 text-4xl' : 'size-14 text-2xl';
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        className={`${btn} grid place-items-center rounded-2xl bg-surface-2 transition active:scale-95 disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Weniger"
      >
        −
      </button>
      <span className={`${size === 'lg' ? 'w-24 text-7xl' : 'w-16 text-4xl'} text-center font-semibold tabular-nums`}>
        {value}
      </span>
      <button
        className={`${btn} grid place-items-center rounded-2xl bg-surface-2 transition active:scale-95 disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Mehr"
      >
        +
      </button>
    </div>
  );
}

/** Bottom-sheet style modal. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/**
 * Standard sheet action layout: the main action full-width on top, secondary actions below,
 * so nothing is cut off on narrow screens. Children should use className="w-full".
 */
export function SheetActions({ primary, children }: { primary: ReactNode; children?: ReactNode }) {
  return (
    <div className="mt-5 grid gap-2">
      {primary}
      {children && <div className="grid auto-cols-fr grid-flow-col gap-2">{children}</div>}
    </div>
  );
}

/** Small transient message at the bottom of the screen. */
export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
      <div className="rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg">{msg}</div>
    </div>
  ) : null;
  return [node, setMsg];
}

export function DeltaBadge({ delta, className = '' }: { delta: number; className?: string }) {
  const color = delta < 0 ? 'text-good' : delta > 0 ? 'text-bad' : 'text-muted';
  return <span className={`font-semibold tabular-nums ${color} ${className}`}>{formatDelta(delta)}</span>;
}
