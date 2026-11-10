// Page notices that code outside a screen can raise: `main.tsx` sets them and every screen
// (the refused-save screens too) shows them, in this order. A screen's own import or storage
// message comes after them.
const ORDER = ['update', 'saveFailed', 'stopped'] as const;
export type NoticeId = (typeof ORDER)[number];
export type PageNotice = {
  id: NoticeId;
  text: string;
  action?: { label: string; run: () => void };
};

const current = new Map<NoticeId, PageNotice>();
const listeners = new Set<() => void>();
let list: PageNotice[] = [];

function changed() {
  list = ORDER.flatMap((id) => current.get(id) ?? []);
  for (const listener of listeners) listener();
}

export function setNotice(notice: PageNotice): void {
  current.set(notice.id, notice);
  changed();
}

export function clearNotice(id: NoticeId): void {
  if (current.delete(id)) changed();
}

// For `useSyncExternalStore`: the list object changes only when a notice does.
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const notices = (): PageNotice[] => list;

// Counts saves that fail in a row, whatever started them. Two show "Saving failed"; any save
// that lands clears it (audit F2). The count starts at 0 on each load of the page.
export function watchSaves<A extends unknown[]>(
  save: (...args: A) => Promise<void>,
): (...args: A) => Promise<void> {
  let failed = 0;
  return (...args) =>
    save(...args).then(
      () => {
        failed = 0;
        clearNotice('saveFailed');
      },
      (error: unknown) => {
        failed += 1;
        if (failed >= 2) setNotice({ id: 'saveFailed', text: 'Saving failed. Export a save.' });
        throw error;
      },
    );
}
