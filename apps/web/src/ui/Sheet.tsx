import { useEffect } from 'react';
import type { ReactNode } from 'react';

// A panel that slides over the tab from the bottom. Its title and Close stay in place while
// the body scrolls.
export function Sheet({
  title,
  onClose,
  children,
  testId,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  testId: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-layer">
      <div className="scrim" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" data-testid={testId}>
        <header className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="btn second" onClick={onClose} autoFocus>
            Close
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}
