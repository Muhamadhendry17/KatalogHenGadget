import { useEffect, useRef } from 'react';

const TONES = {
  danger: {
    iconWrap: 'border-red-400/20 bg-red-500/10 text-red-300',
    confirm: 'bg-red-500 text-white hover:bg-red-400',
    eyebrow: 'text-red-300',
    glow: 'bg-red-500/15',
  },
  primary: {
    iconWrap: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    confirm: 'bg-cyan-400 text-[#04111c] hover:bg-cyan-300',
    eyebrow: 'text-cyan-300',
    glow: 'bg-cyan-400/15',
  },
};

function DefaultIcon({ tone }) {
  if (tone === 'danger') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  busy = false,
  icon,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  const toneStyles = TONES[tone] || TONES.danger;

  useEffect(() => {
    busyRef.current = busy;
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onCancelRef.current?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => (!busy ? onCancel?.() : null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0b111c] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] animate-fade-in sm:p-7"
      >
        <div
          className={`pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-[70px] ${toneStyles.glow}`}
          aria-hidden="true"
        />

        <div className="relative">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneStyles.iconWrap}`}
          >
            {icon || <DefaultIcon tone={tone} />}
          </div>

          <h2 id="confirm-dialog-title" className="mt-4 text-lg font-extrabold text-white">
            {title}
          </h2>
          {description && (
            <div
              id="confirm-dialog-description"
              className="mt-2 text-sm leading-relaxed text-white/55"
            >
              {description}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => (!busy ? onCancel?.() : null)}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => (!busy ? onConfirm?.() : null)}
              disabled={busy}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${toneStyles.confirm}`}
            >
              {busy && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {busy ? 'Memproses...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
