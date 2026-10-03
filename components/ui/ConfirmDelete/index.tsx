'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import { confirmMatches } from '@/utils/deletion';

// "Type X to confirm" dialog for irreversible deletes. The red button only works once the typed
// text matches; Enter/Escape behave as expected.
export default function ConfirmDelete({
  isActive,
  title,
  consequences,
  confirmText,
  confirmLabel,
  buttonLabel,
  onConfirm,
  onCancel,
}: {
  isActive: boolean;
  title: string;
  consequences: ReactNode[];
  confirmText: string; // what the user has to type
  confirmLabel: ReactNode; // "Type the tool name ... to confirm"
  buttonLabel: string;
  onConfirm: () => Promise<string | null>; // returns an error message, or null when done
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const ok = confirmMatches(typed, confirmText);

  useEffect(() => {
    if (!isActive) return;
    setTyped('');
    setError('');
    setBusy(false);
    setTimeout(() => input.current?.focus(), 50);
  }, [isActive]);

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setError('');
    const problem = await onConfirm();
    if (problem) {
      setError(problem);
      setBusy(false);
    }
  };

  return (
    <Modal isActive={isActive} onCancel={busy ? undefined : onCancel} variant="custom" className="max-w-md border border-slate-800 bg-slate-900 p-6 sm:rounded-2xl">
      <div role="alertdialog" aria-labelledby="confirm-delete-title">
        <h2 id="confirm-delete-title" className="text-lg font-semibold text-slate-50">
          {title}
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
          {consequences.map((c, i) => (
            <li key={i} className="flex gap-x-2">
              <span aria-hidden className="font-mono text-red-400">
                !
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <label className="mt-5 block text-sm text-slate-300">
          {confirmLabel}
          <input
            ref={input}
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') void submit();
              if (e.key === 'Escape' && !busy) onCancel();
            }}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-red-500/60"
            aria-label="Confirmation"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-x-3">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-full px-4 py-2 text-sm text-slate-300 hover:text-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!ok || busy}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Deleting…' : buttonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
