const stack: symbol[] = [];

export function dialogCount(): number {
  return stack.length;
}

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function dialog(node: HTMLElement, opts: { close?: () => void } = {}) {
  let current = opts;
  const id = Symbol('dialog');
  stack.push(id);
  const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  node.setAttribute('aria-modal', 'true');
  queueMicrotask(() => {
    const target = node.querySelector<HTMLElement>('[data-autofocus]') ?? node.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    target.focus();
  });
  const onKey = (e: KeyboardEvent) => {
    if (stack[stack.length - 1] !== id) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      current.close?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !node.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !node.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };
  window.addEventListener('keydown', onKey, true);
  return {
    update(next: { close?: () => void }) {
      current = next;
    },
    destroy() {
      window.removeEventListener('keydown', onKey, true);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (prev && document.contains(prev)) prev.focus();
    }
  };
}
